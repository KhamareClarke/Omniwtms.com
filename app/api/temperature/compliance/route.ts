import { NextRequest, NextResponse } from "next/server";
import { requireTenantId } from "@/lib/tenants/context";
import { checkTemperatureCompliance } from "@/lib/temperature/sensors";

export async function GET(request: NextRequest) {
  try {
    const t = requireTenantId(request);
    if (t instanceof NextResponse) return t;
    const deliveryId = request.nextUrl.searchParams.get("delivery_id")?.trim();
    if (!deliveryId) return NextResponse.json({ error: "delivery_id required" }, { status: 400 });
    const c = await checkTemperatureCompliance(t.tenantId, deliveryId);
    return NextResponse.json(c);
  } catch (e) {
    console.error("temperature compliance", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
