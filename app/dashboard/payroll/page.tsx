"use client";

import { useCallback, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { jsPDF } from "jspdf";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

type TrendPoint = {
  month: string;
  grossPay: number;
  netPay: number;
  labor_cost_per_delivery: number;
  deliveries: number;
  hours_logged: number;
};

export default function PayrollPage() {
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7));
  const [hourlyRate, setHourlyRate] = useState("15");
  const [deductionPct, setDeductionPct] = useState("10");
  const [data, setData] = useState<any>(null);
  const [trends, setTrends] = useState<TrendPoint[]>([]);

  const loadTrends = useCallback(async () => {
    const params = new URLSearchParams({
      months: "8",
      anchor: month,
      hourly_rate: hourlyRate,
      deduction_pct: deductionPct,
    });
    const res = await fetch(`/api/payroll/trends?${params.toString()}`, { credentials: "include" });
    const json = await res.json();
    if (!res.ok) return;
    setTrends(Array.isArray(json.points) ? json.points : []);
  }, [month, hourlyRate, deductionPct]);

  const load = async () => {
    const params = new URLSearchParams({
      month,
      hourly_rate: hourlyRate,
      deduction_pct: deductionPct,
    });
    const res = await fetch(`/api/payroll/monthly?${params.toString()}`, { credentials: "include" });
    const json = await res.json();
    if (!res.ok) {
      toast.error(json.error ?? "Failed");
      return;
    }
    setData(json);
    await loadTrends();
  };

  const exportCsv = () => {
    if (!data?.employees?.length) return;
    const lines = ["employee_id,hours,gross,deductions,net,overtime,bonus"];
    for (const e of data.employees) {
      lines.push(
        `${e.employee_id},${e.total_hours},${e.gross},${e.deductions},${e.net},${e.overtime},${e.bonus}`
      );
    }
    const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `payroll-${month}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const exportPdf = () => {
    if (!data?.employees?.length) return;
    const doc = new jsPDF({ unit: "pt", format: "a4" });
    const margin = 48;
    let y = margin;
    doc.setFontSize(16);
    doc.text(`Payroll summary — ${month}`, margin, y);
    y += 28;
    doc.setFontSize(10);
    doc.text(`Gross £${data.totals.grossPay} · Deductions £${data.totals.deductions} · Net £${data.totals.netPay}`, margin, y);
    y += 22;
    doc.text(
      `Labor / delivery £${data.reports.labor_cost_per_delivery} · Deliveries ${data.reports.productivity_metrics.deliveries} · Hours ${data.reports.productivity_metrics.hours_logged}`,
      margin,
      y
    );
    y += 28;
    doc.setFontSize(11);
    doc.text("Employees", margin, y);
    y += 16;
    doc.setFontSize(9);
    for (const e of data.employees) {
      doc.text(
        `${e.employee_id}: ${e.total_hours}h · gross £${e.gross} · net £${e.net} · OT £${e.overtime} · bonus £${e.bonus}`,
        margin,
        y
      );
      y += 14;
      if (y > 780) {
        doc.addPage();
        y = margin;
      }
    }
    if (trends.length) {
      y += 10;
      if (y > 720) {
        doc.addPage();
        y = margin;
      }
      doc.setFontSize(11);
      doc.text("Recent months (net pay)", margin, y);
      y += 16;
      doc.setFontSize(8);
      for (const p of trends.slice(-6)) {
        doc.text(`${p.month}: net £${p.netPay} · labor/delivery £${p.labor_cost_per_delivery}`, margin, y);
        y += 12;
      }
    }
    doc.save(`payroll-${month}.pdf`);
  };

  const exportTrendsCsv = () => {
    if (!trends.length) return;
    const lines = ["month,grossPay,netPay,labor_cost_per_delivery,deliveries,hours_logged"];
    for (const p of trends) {
      lines.push(
        `${p.month},${p.grossPay},${p.netPay},${p.labor_cost_per_delivery},${p.deliveries},${p.hours_logged}`
      );
    }
    const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `payroll-trends-to-${month}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const markPaid = async () => {
    if (!data?.totals) return;
    const res = await fetch("/api/payroll/mark-paid", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        month,
        gross_pay: data.totals.grossPay,
        deductions: data.totals.deductions,
        net_pay: data.totals.netPay,
      }),
    });
    const json = await res.json();
    if (!res.ok) {
      toast.error(json.error ?? "Failed");
      return;
    }
    toast.success("Marked payroll as paid");
  };

  const deductions = useMemo(() => Number(deductionPct) || 0, [deductionPct]);

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold">Payroll Management</h1>
      <Card>
        <CardHeader>
          <CardTitle>Monthly filters</CardTitle>
        </CardHeader>
        <CardContent className="grid md:grid-cols-4 gap-3">
          <div className="space-y-2">
            <Label>Month</Label>
            <Input type="month" value={month} onChange={(e) => setMonth(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Hourly rate (£)</Label>
            <Input value={hourlyRate} onChange={(e) => setHourlyRate(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Deductions (%)</Label>
            <Input value={deductionPct} onChange={(e) => setDeductionPct(e.target.value)} />
          </div>
          <div className="flex items-end">
            <Button onClick={() => void load()}>Load payroll</Button>
          </div>
        </CardContent>
      </Card>

      {data ? (
        <>
          <div className="grid md:grid-cols-4 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Gross Pay</CardTitle>
              </CardHeader>
              <CardContent className="text-2xl font-bold">£{data.totals.grossPay}</CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Deductions</CardTitle>
              </CardHeader>
              <CardContent className="text-2xl font-bold">£{data.totals.deductions}</CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Net Pay</CardTitle>
              </CardHeader>
              <CardContent className="text-2xl font-bold">£{data.totals.netPay}</CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Labor/Delivery</CardTitle>
              </CardHeader>
              <CardContent className="text-2xl font-bold">£{data.reports.labor_cost_per_delivery}</CardContent>
            </Card>
          </div>

          {trends.length > 0 ? (
            <Card>
              <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-2">
                <CardTitle>Payroll & productivity trends</CardTitle>
                <Button variant="outline" size="sm" onClick={exportTrendsCsv}>
                  Export trends CSV
                </Button>
              </CardHeader>
              <CardContent className="h-[320px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={trends} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip formatter={(v: number) => `£${v}`} />
                    <Legend />
                    <Line type="monotone" dataKey="netPay" name="Net pay" stroke="#3456FF" strokeWidth={2} dot />
                    <Line type="monotone" dataKey="grossPay" name="Gross pay" stroke="#16a34a" strokeWidth={2} dot />
                    <Line
                      type="monotone"
                      dataKey="labor_cost_per_delivery"
                      name="Labor / delivery"
                      stroke="#f97316"
                      strokeWidth={2}
                      dot
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
              <CardContent className="pt-0 text-xs text-muted-foreground">
                Series uses the same hourly rate and deduction % as filters, anchored on the selected month (
                {deductions}% deductions).
              </CardContent>
            </Card>
          ) : null}

          <Card>
            <CardHeader>
              <CardTitle>Employees</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {(data.employees ?? []).map((e: any) => (
                <div
                  key={e.employee_id}
                  className="border rounded-md p-3 flex flex-wrap items-center justify-between gap-2"
                >
                  <div>
                    <div className="font-medium">{e.employee_id}</div>
                    <div className="text-xs text-muted-foreground">
                      {e.total_hours}h · overtime £{e.overtime} · bonus £{e.bonus}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge>Gross £{e.gross}</Badge>
                    <Badge variant="secondary">Net £{e.net}</Badge>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Reports & exports</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div>Monthly payroll (net): £{data.reports.monthly_payroll}</div>
              <div>Labor cost per delivery: £{data.reports.labor_cost_per_delivery}</div>
              <div>
                Productivity: {data.reports.productivity_metrics.deliveries} deliveries /{" "}
                {data.reports.productivity_metrics.hours_logged}h logged
              </div>
              <div className="flex flex-wrap gap-2 pt-2">
                <Button variant="outline" onClick={exportCsv}>
                  Export employee CSV
                </Button>
                <Button variant="outline" onClick={exportPdf}>
                  Download PDF summary
                </Button>
                <Button onClick={() => void markPaid()}>Mark paid</Button>
              </div>
            </CardContent>
          </Card>
        </>
      ) : (
        <Card>
          <CardContent className="py-8 text-sm text-muted-foreground">
            Set month/rates, then load payroll.
          </CardContent>
        </Card>
      )}
    </div>
  );
}
