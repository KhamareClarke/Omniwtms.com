"use client";

import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

export default function PayrollPage() {
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7));
  const [hourlyRate, setHourlyRate] = useState("15");
  const [deductionPct, setDeductionPct] = useState("10");
  const [data, setData] = useState<any>(null);

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
            <Card><CardHeader><CardTitle>Gross Pay</CardTitle></CardHeader><CardContent className="text-2xl font-bold">£{data.totals.grossPay}</CardContent></Card>
            <Card><CardHeader><CardTitle>Deductions</CardTitle></CardHeader><CardContent className="text-2xl font-bold">£{data.totals.deductions}</CardContent></Card>
            <Card><CardHeader><CardTitle>Net Pay</CardTitle></CardHeader><CardContent className="text-2xl font-bold">£{data.totals.netPay}</CardContent></Card>
            <Card><CardHeader><CardTitle>Labor/Delivery</CardTitle></CardHeader><CardContent className="text-2xl font-bold">£{data.reports.labor_cost_per_delivery}</CardContent></Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Employees</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {(data.employees ?? []).map((e: any) => (
                <div key={e.employee_id} className="border rounded-md p-3 flex flex-wrap items-center justify-between gap-2">
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
              <CardTitle>Reports</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div>Monthly payroll: £{data.reports.monthly_payroll}</div>
              <div>Labor cost per delivery: £{data.reports.labor_cost_per_delivery}</div>
              <div>
                Productivity: {data.reports.productivity_metrics.deliveries} deliveries / {data.reports.productivity_metrics.hours_logged}h
              </div>
              <div>Cost trend basis: run endpoint across months for charting.</div>
              <div className="flex gap-2 pt-2">
                <Button variant="outline" onClick={exportCsv}>Export CSV</Button>
                <Button onClick={() => void markPaid()}>Mark Paid</Button>
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
