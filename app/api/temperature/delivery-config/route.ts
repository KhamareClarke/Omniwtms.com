import { NextRequest, NextResponse } from "next/server";
import { requireTenantId } from "@/lib/tenants/context";
import { createAdminServiceClient } from "@/lib/supabase/admin-service";

/**
 * POST /api/temperature/delivery-config
 * Body: { delivery_id, requires_temperature_monitoring?, temp_alert_min_c?, temp_alert_max_c? }
 */
export async function POST(request: NextRequest) {
  try {
    const t = requireTenantId(request);
    if (t instanceof NextResponse) return t;
    let body: {
      delivery_id?: string;
      requires_temperature_monitoring?: boolean;
      temp_alert_min_c?: number | null;
      temp_alert_max_c?: number | null;
    };
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }
    const id = body.delivery_id?.trim();
    if (!id) return NextResponse.json({ error: "delivery_id required" }, { status: 400 });
    const supabase = createAdminServiceClient();
    const patch: Record<string, unknown> = {};
    if (body.requires_temperature_monitoring !== undefined) {
      patch.requires_temperature_monitoring = body.requires_temperature_monitoring;
    }
    if (body.temp_alert_min_c !== undefined) patch.temp_alert_min_c = body.temp_alert_min_c;
    if (body.temp_alert_max_c !== undefined) patch.temp_alert_max_c = body.temp_alert_max_c;
    if (Object.keys(patch).length === 0) return NextResponse.json({ error: "no fields" }, { status: 400 });

    const { error } = await supabase.from("deliveries").update(patch).eq("id", id).eq("tenant_id", t.tenantId);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("delivery-config", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
