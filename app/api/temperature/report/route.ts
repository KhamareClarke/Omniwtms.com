import { NextRequest, NextResponse } from "next/server";
import { requireTenantId } from "@/lib/tenants/context";
import { generateTemperatureReport } from "@/lib/temperature/sensors";

export async function GET(request: NextRequest) {
  try {
    const t = requireTenantId(request);
    if (t instanceof NextResponse) return t;
    const deliveryId = request.nextUrl.searchParams.get("delivery_id")?.trim();
    const from = request.nextUrl.searchParams.get("from")?.trim();
    const to = request.nextUrl.searchParams.get("to")?.trim();
    if (!deliveryId || !from || !to) {
      return NextResponse.json({ error: "delivery_id, from, to required (ISO)" }, { status: 400 });
    }
    const report = await generateTemperatureReport(t.tenantId, deliveryId, from, to);
    return NextResponse.json(report);
  } catch (e) {
    console.error("temperature report", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
