import { NextRequest, NextResponse } from "next/server";
import { requireTenantId } from "@/lib/tenants/context";
import { getAnalyticsBundle } from "@/lib/analytics/recommendations";

/**
 * GET /api/dashboard/analytics?warehouseId=optional
 * Aggregated analytics for the tenant (cookie/header tenant context).
 */
export async function GET(request: NextRequest) {
  try {
    const t = requireTenantId(request);
    if (t instanceof NextResponse) return t;

    const warehouseId = request.nextUrl.searchParams.get("warehouseId")?.trim() || null;
    const bundle = await getAnalyticsBundle(t.tenantId, warehouseId);

    return NextResponse.json(bundle);
  } catch (e) {
    console.error("dashboard/analytics", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
