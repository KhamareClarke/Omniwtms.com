import { NextRequest, NextResponse } from "next/server";
import { createAdminServiceClient } from "@/lib/supabase/admin-service";
import { DEFAULT_TENANT_ID } from "@/lib/tenants/constants";
import { getNotificationPreferences, upsertNotificationPreferences } from "@/lib/notifications/preferences";
import { TEMPLATE_IDS } from "@/lib/email/templates/types";

async function resolveTenantId(clientId: string | undefined): Promise<string | null> {
  if (!clientId?.trim()) return null;
  const supabase = createAdminServiceClient();
  const { data } = await supabase.from("clients").select("tenant_id").eq("id", clientId.trim()).maybeSingle();
  const tid = (data as { tenant_id?: string | null } | null)?.tenant_id;
  return tid?.trim() || DEFAULT_TENANT_ID;
}

export async function GET(request: NextRequest) {
  try {
    const clientId = request.nextUrl.searchParams.get("client_id")?.trim();
    const tenantId = await resolveTenantId(clientId || undefined);
    if (!tenantId) {
      return NextResponse.json({ error: "client_id required" }, { status: 400 });
    }
    const prefs = await getNotificationPreferences(tenantId);
    return NextResponse.json({
      tenant_id: tenantId,
      template_ids: TEMPLATE_IDS,
      preferences: prefs ?? {
        email: {},
        smsEnabled: true,
        pushEnabled: false,
        smsProvider: "ghl",
      },
    });
  } catch (e) {
    console.error("preferences GET", e);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const clientId = typeof body.client_id === "string" ? body.client_id : "";
    const tenantId = await resolveTenantId(clientId);
    if (!tenantId) {
      return NextResponse.json({ error: "client_id required" }, { status: 400 });
    }
    await upsertNotificationPreferences(tenantId, {
      email: body.email,
      smsEnabled: body.sms_enabled,
      pushEnabled: body.push_enabled,
      smsProvider: body.sms_provider,
    });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("preferences POST", e);
    return NextResponse.json({ error: e instanceof Error ? e.message : "Failed" }, { status: 500 });
  }
}
