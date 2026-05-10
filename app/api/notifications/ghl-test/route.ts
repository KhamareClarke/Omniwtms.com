import { NextRequest, NextResponse } from "next/server";
import { getGhlCredentialsForTenant } from "@/lib/ghl/credentials";
import { testGhlConnectivity } from "@/lib/ghl/test-connectivity";
import { createAdminServiceClient } from "@/lib/supabase/admin-service";
import { DEFAULT_TENANT_ID } from "@/lib/tenants/constants";

async function resolveTenantId(clientId: string): Promise<string | null> {
  if (!clientId?.trim()) return null;
  const supabase = createAdminServiceClient();
  const { data } = await supabase.from("clients").select("tenant_id").eq("id", clientId.trim()).maybeSingle();
  const tid = (data as { tenant_id?: string | null } | null)?.tenant_id;
  return tid?.trim() || DEFAULT_TENANT_ID;
}

/**
 * POST /api/notifications/ghl-test
 * Body: { client_id } or { ghl_api_key, ghl_location_id } for ad-hoc test.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    let apiKey = typeof body.ghl_api_key === "string" ? body.ghl_api_key.trim() : "";
    let locationId = typeof body.ghl_location_id === "string" ? body.ghl_location_id.trim() : "";

    if ((!apiKey || !locationId) && typeof body.client_id === "string" && body.client_id.trim()) {
      const tenantId = await resolveTenantId(body.client_id.trim());
      const creds = await getGhlCredentialsForTenant(tenantId);
      if (creds) {
        apiKey = creds.apiKey;
        locationId = creds.locationId;
      }
    }

    if (!apiKey || !locationId) {
      return NextResponse.json(
        { ok: false, error: "Provide ghl_api_key + ghl_location_id or client_id with saved GHL credentials." },
        { status: 400 }
      );
    }

    const r = await testGhlConnectivity({ apiKey, locationId });
    if (!r.ok) return NextResponse.json({ ok: false, error: r.error }, { status: 502 });
    return NextResponse.json({ ok: true, message: "Go High Level API reachable for this location." });
  } catch (e) {
    console.error("ghl-test", e);
    return NextResponse.json({ ok: false, error: "Bad request" }, { status: 400 });
  }
}
