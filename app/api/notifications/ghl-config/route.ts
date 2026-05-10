import { NextRequest, NextResponse } from "next/server";
import { createAdminServiceClient } from "@/lib/supabase/admin-service";
import { DEFAULT_TENANT_ID } from "@/lib/tenants/constants";

async function resolveTenantId(clientId: string): Promise<string | null> {
  if (!clientId?.trim()) return null;
  const supabase = createAdminServiceClient();
  const { data } = await supabase.from("clients").select("tenant_id").eq("id", clientId.trim()).maybeSingle();
  const tid = (data as { tenant_id?: string | null } | null)?.tenant_id;
  return tid?.trim() || DEFAULT_TENANT_ID;
}

function maskKey(key: string): string {
  const k = key.trim();
  if (k.length <= 10) return "••••";
  return `${k.slice(0, 4)}…${k.slice(-4)}`;
}

/**
 * GET — current GHL fields for tenant (masked key).
 * POST — save ghl_location_id / ghl_api_key on tenants row.
 */
export async function GET(request: NextRequest) {
  try {
    const clientId = request.nextUrl.searchParams.get("client_id")?.trim();
    if (!clientId) return NextResponse.json({ error: "client_id required" }, { status: 400 });
    const tenantId = await resolveTenantId(clientId);
    if (!tenantId) return NextResponse.json({ error: "tenant not found" }, { status: 404 });

    const supabase = createAdminServiceClient();
    const { data, error } = await supabase
      .from("tenants")
      .select("ghl_location_id, ghl_api_key")
      .eq("id", tenantId)
      .maybeSingle();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    const row = data as { ghl_location_id?: string | null; ghl_api_key?: string | null } | null;
    return NextResponse.json({
      tenant_id: tenantId,
      ghl_location_id: row?.ghl_location_id ?? null,
      ghl_api_key_masked: row?.ghl_api_key ? maskKey(row.ghl_api_key) : null,
      ghl_api_key_set: Boolean(row?.ghl_api_key?.trim()),
    });
  } catch (e) {
    console.error("ghl-config GET", e);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const clientId = typeof body.client_id === "string" ? body.client_id.trim() : "";
    if (!clientId) return NextResponse.json({ error: "client_id required" }, { status: 400 });
    const tenantId = await resolveTenantId(clientId);
    if (!tenantId) return NextResponse.json({ error: "tenant not found" }, { status: 404 });

    const supabase = createAdminServiceClient();
    const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (typeof body.ghl_location_id === "string") {
      patch.ghl_location_id = body.ghl_location_id.trim() || null;
    }
    if (typeof body.ghl_api_key === "string" && body.ghl_api_key.trim() !== "") {
      patch.ghl_api_key = body.ghl_api_key.trim();
    }

    const { error } = await supabase.from("tenants").update(patch).eq("id", tenantId);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("ghl-config POST", e);
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
}
