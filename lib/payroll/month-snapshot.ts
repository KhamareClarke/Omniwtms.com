import type { SupabaseClient } from "@supabase/supabase-js";
import { calculateEmployeePayroll, calculateTotalPayroll, minutesBetween } from "@/lib/payroll/calculate";

export type PayrollMonthSnapshot = {
  month: string;
  employees: Array<{
    employee_id: string;
    total_hours: number;
    gross: number;
    deductions: number;
    net: number;
    overtime: number;
    bonus: number;
    logs: number;
  }>;
  totals: ReturnType<typeof calculateTotalPayroll>;
  reports: {
    monthly_payroll: number;
    labor_cost_per_delivery: number;
    productivity_metrics: { deliveries: number; hours_logged: number };
  };
};

export async function getPayrollMonthSnapshot(
  supabase: SupabaseClient,
  tenantId: string,
  month: string,
  defaultHourlyRate: number,
  deductionRatePct: number
): Promise<PayrollMonthSnapshot> {
  const from = `${month}-01T00:00:00.000Z`;
  const d = new Date(`${month}-01T00:00:00.000Z`);
  d.setUTCMonth(d.getUTCMonth() + 1);
  const to = d.toISOString();

  const { data, error } = await supabase
    .from("time_logs")
    .select("employee_id, start_time, end_time, break_duration_minutes, task_type, status")
    .eq("tenant_id", tenantId)
    .gte("start_time", from)
    .lt("start_time", to);
  if (error) throw new Error(error.message);

  const byEmp = new Map<
    string,
    { employee_id: string; total_minutes: number; logs: number }
  >();
  for (const row of (data ?? []) as any[]) {
    const id = String(row.employee_id);
    const mins = minutesBetween(row.start_time, row.end_time, row.break_duration_minutes ?? 0);
    const prev = byEmp.get(id) ?? { employee_id: id, total_minutes: 0, logs: 0 };
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
      employee_id: r.employee_id,
      total_hours: hours,
      gross: pay.gross,
      deductions: pay.deductions,
      net: pay.net,
      overtime: pay.overtime,
      bonus: pay.bonus,
      logs: r.logs,
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
    .eq("tenant_id", tenantId)
    .gte("created_at", from)
    .lt("created_at", to);
  const laborCostPerDelivery = (deliveriesCount ?? 0) > 0 ? totals.grossPay / (deliveriesCount ?? 1) : 0;

  return {
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
    },
  };
}
