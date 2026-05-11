import { NextRequest, NextResponse } from "next/server";
import { requireTenantId } from "@/lib/tenants/context";
import { createAdminServiceClient } from "@/lib/supabase/admin-service";
import { calculateEmployeePayroll, calculateTotalPayroll, minutesBetween } from "@/lib/payroll/calculate";

type EmployeeRollup = {
  employee_id: string;
  total_minutes: number;
  total_hours: number;
  gross: number;
  deductions: number;
  net: number;
  overtime: number;
  bonus: number;
  logs: number;
};

export async function GET(request: NextRequest) {
  try {
    const t = requireTenantId(request);
    if (t instanceof NextResponse) return t;
    const month = request.nextUrl.searchParams.get("month")?.trim() ?? new Date().toISOString().slice(0, 7);
    if (!/^\d{4}-\d{2}$/.test(month)) return NextResponse.json({ error: "month must be YYYY-MM" }, { status: 400 });
    const from = `${month}-01T00:00:00.000Z`;
    const d = new Date(`${month}-01T00:00:00.000Z`);
    d.setUTCMonth(d.getUTCMonth() + 1);
    const to = d.toISOString();
    const defaultHourlyRate = Number(request.nextUrl.searchParams.get("hourly_rate") ?? 15);
    const deductionRatePct = Number(request.nextUrl.searchParams.get("deduction_pct") ?? 10);

    const supabase = createAdminServiceClient();
    const { data, error } = await supabase
      .from("time_logs")
      .select("employee_id, start_time, end_time, break_duration_minutes, task_type, status")
      .eq("tenant_id", t.tenantId)
      .gte("start_time", from)
      .lt("start_time", to);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    const byEmp = new Map<string, EmployeeRollup>();
    for (const row of (data ?? []) as any[]) {
      const id = String(row.employee_id);
      const mins = minutesBetween(row.start_time, row.end_time, row.break_duration_minutes ?? 0);
      const prev = byEmp.get(id) ?? {
        employee_id: id,
        total_minutes: 0,
        total_hours: 0,
        gross: 0,
        deductions: 0,
        net: 0,
        overtime: 0,
        bonus: 0,
        logs: 0,
      };
      prev.total_minutes += mins;
      prev.logs += 1;
      byEmp.set(id, prev);
    }

    const employees = [...byEmp.values()].map((r) => {
      const hours = Math.round((r.total_minutes / 60) * 100) / 100;
      const bonus = r.logs >= 20 ? 50 : 0;
      const deductions = (hours * defaultHourlyRate + bonus) * (deductionRatePct / 100);
      const pay = calculateEmployeePayroll({
        employeeId: r.employee_id,
        hours,
        hourlyRate: defaultHourlyRate,
        bonus,
        deductions,
      });
      return {
        ...r,
        total_hours: hours,
        gross: pay.gross,
        deductions: pay.deductions,
        net: pay.net,
        overtime: pay.overtime,
        bonus: pay.bonus,
      };
    });

    const totals = calculateTotalPayroll(
      employees.map((e) => ({
        employeeId: e.employee_id,
        hours: e.total_hours,
        hourlyRate: defaultHourlyRate,
        bonus: e.bonus,
        deductions: e.deductions,
      }))
    );

    const totalHours = employees.reduce((a, b) => a + b.total_hours, 0);
    const { count: deliveriesCount } = await supabase
      .from("deliveries")
      .select("id", { count: "exact", head: true })
      .eq("tenant_id", t.tenantId)
      .gte("created_at", from)
      .lt("created_at", to);
    const laborCostPerDelivery = (deliveriesCount ?? 0) > 0 ? totals.grossPay / (deliveriesCount ?? 1) : 0;

    return NextResponse.json({
      month,
      employees,
      totals,
      reports: {
        monthly_payroll: totals.netPay,
        labor_cost_per_delivery: Math.round(laborCostPerDelivery * 100) / 100,
        productivity_metrics: {
          deliveries: deliveriesCount ?? 0,
          hours_logged: Math.round(totalHours * 100) / 100,
        },
        cost_trends: {
          note: "Use this endpoint by month for trend charting",
        },
      },
    });
  } catch (e) {
    console.error("payroll monthly", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
