import { NextRequest, NextResponse } from "next/server";
import { requireTenantId } from "@/lib/tenants/context";
import { createAdminServiceClient } from "@/lib/supabase/admin-service";

/** Deliveries flagged for cold-chain monitoring. */
export async function GET(request: NextRequest) {
  try {
    const t = requireTenantId(request);
    if (t instanceof NextResponse) return t;
    const supabase = createAdminServiceClient();
    const { data, error } = await supabase
      .from("deliveries")
      .select("id, package_id, status, temp_alert_min_c, temp_alert_max_c, requires_temperature_monitoring, customer_id, created_at")
      .eq("tenant_id", t.tenantId)
      .eq("requires_temperature_monitoring", true)
      .order("created_at", { ascending: false })
      .limit(200);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ deliveries: data ?? [] });
  } catch (e) {
    console.error("monitored-deliveries", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
