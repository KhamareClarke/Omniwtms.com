import { NextRequest, NextResponse } from "next/server";
import { requireTenantId } from "@/lib/tenants/context";
import {
  buildCustomReport,
  type CustomReportMetric,
} from "@/lib/analytics/custom-report";

type Body = {
  metrics?: string[];
  dateFrom?: string;
  dateTo?: string;
  warehouseId?: string | null;
};

const ALLOWED: CustomReportMetric[] = [
  "orders_volume",
  "deliveries_status",
  "warehouse_utilization",
  "inventory_movements",
  "revenue_proxy",
];

/**
 * POST /api/dashboard/analytics/custom-report
 * Body: { metrics[], dateFrom, dateTo, warehouseId? }
 */
export async function POST(request: NextRequest) {
  try {
    const t = requireTenantId(request);
    if (t instanceof NextResponse) return t;

    let body: Body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }

    const metrics = (body.metrics ?? []).filter((m): m is CustomReportMetric =>
      ALLOWED.includes(m as CustomReportMetric)
    );
    if (!metrics.length) {
      return NextResponse.json({ error: "Select at least one metric" }, { status: 400 });
    }
    if (!body.dateFrom || !body.dateTo) {
      return NextResponse.json({ error: "dateFrom and dateTo required (ISO strings)" }, { status: 400 });
    }

    const result = await buildCustomReport(t.tenantId, {
      metrics,
      dateFrom: body.dateFrom,
      dateTo: body.dateTo,
      warehouseId: body.warehouseId ?? null,
    });

    return NextResponse.json({ ok: true, ...result });
  } catch (e) {
    console.error("custom-report", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
