import { NextRequest, NextResponse } from "next/server";
import { requireTenantId } from "@/lib/tenants/context";
import { createAdminServiceClient } from "@/lib/supabase/admin-service";
import { getPayrollMonthSnapshot } from "@/lib/payroll/month-snapshot";

function addMonths(ym: string, delta: number): string {
  const [y, m] = ym.split("-").map(Number);
  const d = new Date(Date.UTC(y, m - 1 + delta, 1));
  const yy = d.getUTCFullYear();
  const mm = String(d.getUTCMonth() + 1).padStart(2, "0");
  return `${yy}-${mm}`;
}

/**
 * GET /api/payroll/trends?months=6&hourly_rate=15&deduction_pct=10
 * Rolling monthly snapshots for charts (default ends at current calendar month).
 */
export async function GET(request: NextRequest) {
  try {
    const t = requireTenantId(request);
    if (t instanceof NextResponse) return t;
    const n = Math.min(24, Math.max(1, Number(request.nextUrl.searchParams.get("months") ?? 6)));
    const anchor = request.nextUrl.searchParams.get("anchor")?.trim() ?? new Date().toISOString().slice(0, 7);
    if (!/^\d{4}-\d{2}$/.test(anchor)) {
      return NextResponse.json({ error: "anchor must be YYYY-MM" }, { status: 400 });
    }
    const defaultHourlyRate = Number(request.nextUrl.searchParams.get("hourly_rate") ?? 15);
    const deductionRatePct = Number(request.nextUrl.searchParams.get("deduction_pct") ?? 10);

    const supabase = createAdminServiceClient();
    const points: Array<{
      month: string;
      grossPay: number;
      netPay: number;
      labor_cost_per_delivery: number;
      deliveries: number;
      hours_logged: number;
    }> = [];

    for (let i = n - 1; i >= 0; i--) {
      const month = addMonths(anchor, -(n - 1 - i));
      try {
        const snap = await getPayrollMonthSnapshot(supabase, t.tenantId, month, defaultHourlyRate, deductionRatePct);
        points.push({
          month: snap.month,
          grossPay: snap.totals.grossPay,
          netPay: snap.totals.netPay,
          labor_cost_per_delivery: snap.reports.labor_cost_per_delivery,
          deliveries: snap.reports.productivity_metrics.deliveries,
          hours_logged: snap.reports.productivity_metrics.hours_logged,
        });
      } catch {
        points.push({
          month,
          grossPay: 0,
          netPay: 0,
          labor_cost_per_delivery: 0,
          deliveries: 0,
          hours_logged: 0,
        });
      }
    }

    return NextResponse.json({ anchor, months: n, points });
  } catch (e) {
    console.error("payroll trends", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
