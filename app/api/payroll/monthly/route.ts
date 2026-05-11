import { NextRequest, NextResponse } from "next/server";
import { requireTenantId } from "@/lib/tenants/context";
import { createAdminServiceClient } from "@/lib/supabase/admin-service";
import { getPayrollMonthSnapshot } from "@/lib/payroll/month-snapshot";

export async function GET(request: NextRequest) {
  try {
    const t = requireTenantId(request);
    if (t instanceof NextResponse) return t;
    const month = request.nextUrl.searchParams.get("month")?.trim() ?? new Date().toISOString().slice(0, 7);
    if (!/^\d{4}-\d{2}$/.test(month)) return NextResponse.json({ error: "month must be YYYY-MM" }, { status: 400 });
    const defaultHourlyRate = Number(request.nextUrl.searchParams.get("hourly_rate") ?? 15);
    const deductionRatePct = Number(request.nextUrl.searchParams.get("deduction_pct") ?? 10);

    const supabase = createAdminServiceClient();
    const snap = await getPayrollMonthSnapshot(supabase, t.tenantId, month, defaultHourlyRate, deductionRatePct);

    return NextResponse.json({
      month: snap.month,
      employees: snap.employees,
      totals: snap.totals,
      reports: {
        ...snap.reports,
        cost_trends: {
          note: "Use GET /api/payroll/trends for multi-month series",
        },
      },
    });
  } catch (e) {
    console.error("payroll monthly", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
