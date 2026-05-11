export type WageInput = {
  hours: number;
  hourlyRate: number;
};

export type PayrollEmployee = {
  employeeId: string;
  hours: number;
  hourlyRate: number;
  bonus?: number;
  deductions?: number;
};

export function calculateHourlyWage(input: WageInput): number {
  return Math.max(0, input.hours) * Math.max(0, input.hourlyRate);
}

/** Overtime multiplier 1.5x after 40 hours weekly-equivalent in the selected period. */
export function calculateOvertime(hours: number, hourlyRate: number): number {
  const overtimeHours = Math.max(0, hours - 40);
  return overtimeHours * Math.max(0, hourlyRate) * 1.5;
}

export function calculateBonus(basePay: number, bonusPercentOrFlat: number, mode: "percent" | "flat" = "flat"): number {
  if (mode === "percent") return Math.max(0, basePay) * Math.max(0, bonusPercentOrFlat) / 100;
  return Math.max(0, bonusPercentOrFlat);
}

export function calculateEmployeePayroll(emp: PayrollEmployee): {
  gross: number;
  overtime: number;
  bonus: number;
  deductions: number;
  net: number;
} {
  const base = calculateHourlyWage({ hours: Math.min(emp.hours, 40), hourlyRate: emp.hourlyRate });
  const overtime = calculateOvertime(emp.hours, emp.hourlyRate);
  const bonus = Math.max(0, emp.bonus ?? 0);
  const deductions = Math.max(0, emp.deductions ?? 0);
  const gross = base + overtime + bonus;
  const net = Math.max(0, gross - deductions);
  return { gross, overtime, bonus, deductions, net };
}

export function calculateTotalPayroll(employees: PayrollEmployee[]): {
  grossPay: number;
  deductions: number;
  netPay: number;
  overtimePay: number;
  bonusPay: number;
} {
  let grossPay = 0;
  let deductions = 0;
  let netPay = 0;
  let overtimePay = 0;
  let bonusPay = 0;
  for (const e of employees) {
    const r = calculateEmployeePayroll(e);
    grossPay += r.gross;
    deductions += r.deductions;
    netPay += r.net;
    overtimePay += r.overtime;
    bonusPay += r.bonus;
  }
  return {
    grossPay: Math.round(grossPay * 100) / 100,
    deductions: Math.round(deductions * 100) / 100,
    netPay: Math.round(netPay * 100) / 100,
    overtimePay: Math.round(overtimePay * 100) / 100,
    bonusPay: Math.round(bonusPay * 100) / 100,
  };
}

export function minutesBetween(startIso: string, endIso?: string | null, breakMinutes = 0): number {
  if (!endIso) return 0;
  const start = new Date(startIso).getTime();
  const end = new Date(endIso).getTime();
  if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) return 0;
  return Math.max(0, Math.round((end - start) / 60000) - Math.max(0, breakMinutes));
}
