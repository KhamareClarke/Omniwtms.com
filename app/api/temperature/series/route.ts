import { NextRequest, NextResponse } from "next/server";
import { requireTenantId } from "@/lib/tenants/context";
import { createAdminServiceClient } from "@/lib/supabase/admin-service";

export async function GET(request: NextRequest) {
  try {
    const t = requireTenantId(request);
    if (t instanceof NextResponse) return t;
    const deliveryId = request.nextUrl.searchParams.get("delivery_id")?.trim();
    if (!deliveryId) return NextResponse.json({ error: "delivery_id required" }, { status: 400 });
    const supabase = createAdminServiceClient();
    const { data: d } = await supabase.from("deliveries").select("id").eq("id", deliveryId).eq("tenant_id", t.tenantId).maybeSingle();
    if (!d) return NextResponse.json({ error: "delivery not found" }, { status: 404 });

    const { data, error } = await supabase
      .from("temperature_readings")
      .select("timestamp, reading_value, within_range, device_id")
      .eq("tenant_id", t.tenantId)
      .eq("delivery_id", deliveryId)
      .order("timestamp", { ascending: true })
      .limit(2000);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ readings: data ?? [] });
  } catch (e) {
    console.error("temperature series", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
