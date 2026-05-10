"use client";

import { useState } from "react";
import Link from "next/link";
import { format } from "date-fns";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Bar, BarChart, CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Download, FileSpreadsheet, FileText, ArrowLeft } from "lucide-react";
import { toast } from "sonner";

const METRICS = [
  { id: "orders_volume", label: "Orders volume" },
  { id: "deliveries_status", label: "Deliveries by status" },
  { id: "warehouse_utilization", label: "Warehouse utilization" },
  { id: "inventory_movements", label: "Inventory movements" },
  { id: "revenue_proxy", label: "Revenue proxy (completed deliveries)" },
] as const;

type MetricId = (typeof METRICS)[number]["id"];

export default function CustomReportPage() {
  const [selected, setSelected] = useState<Record<MetricId, boolean>>({
    orders_volume: true,
    deliveries_status: false,
    warehouse_utilization: false,
    inventory_movements: false,
    revenue_proxy: false,
  });
  const [chartType, setChartType] = useState<"bar" | "line">("bar");
  const [dateFrom, setDateFrom] = useState(format(new Date(Date.now() - 30 * 86400000), "yyyy-MM-dd"));
  const [dateTo, setDateTo] = useState(format(new Date(), "yyyy-MM-dd"));
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    series: Record<string, { label: string; value: number }[]>;
    summary: Record<string, number>;
  } | null>(null);

  const run = async () => {
    const metrics = (Object.keys(selected) as MetricId[]).filter((k) => selected[k]);
    if (!metrics.length) {
      toast.error("Select at least one metric");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/dashboard/analytics/custom-report", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ metrics, dateFrom: `${dateFrom}T00:00:00.000Z`, dateTo: `${dateTo}T23:59:59.999Z` }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "Failed");
        return;
      }
      setResult({ series: data.series, summary: data.summary });
    } catch {
      toast.error("Network error");
    } finally {
      setLoading(false);
    }
  };

  const exportCsv = () => {
    if (!result) return;
    const lines: string[] = [];
    for (const [key, pts] of Object.entries(result.series)) {
      lines.push(`# ${key}`);
      lines.push("label,value");
      for (const p of pts) lines.push(`${p.label},${p.value}`);
      lines.push("");
    }
    const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `custom-report-${dateFrom}-${dateTo}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
    toast.success("CSV downloaded");
  };

  const exportExcel = async () => {
    if (!result) return;
    const XLSX = await import("xlsx");
    const wb = XLSX.utils.book_new();
    for (const [key, pts] of Object.entries(result.series)) {
      const ws = XLSX.utils.json_to_sheet(pts);
      XLSX.utils.book_append_sheet(wb, ws, key.slice(0, 31));
    }
    XLSX.writeFile(wb, `custom-report-${dateFrom}-${dateTo}.xlsx`);
    toast.success("Excel downloaded");
  };

  const exportPdf = async () => {
    if (!result) return;
    const { jsPDF } = await import("jspdf");
    const doc = new jsPDF();
    let y = 14;
    doc.setFontSize(14);
    doc.text("OmniWTMS — Custom report", 14, y);
    y += 10;
    doc.setFontSize(10);
    doc.text(`Range: ${dateFrom} → ${dateTo}`, 14, y);
    y += 8;
    for (const [key, pts] of Object.entries(result.series)) {
      doc.text(key, 14, y);
      y += 6;
      for (const p of pts.slice(0, 20)) {
        doc.text(`${p.label}: ${p.value}`, 18, y);
        y += 5;
        if (y > 280) {
          doc.addPage();
          y = 14;
        }
      }
      y += 4;
    }
    doc.save(`custom-report-${dateFrom}-${dateTo}.pdf`);
    toast.success("PDF downloaded");
  };

  const firstSeriesKey = result ? Object.keys(result.series)[0] : null;
  const chartData = firstSeriesKey ? result!.series[firstSeriesKey]! : [];

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/dashboard/reports">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Custom report builder</h1>
          <p className="text-sm text-muted-foreground">Metrics, range, chart, export</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Parameters</CardTitle>
          <CardDescription>Data is scoped to your organization (tenant cookie).</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>From</Label>
              <input
                type="date"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>To</Label>
              <input
                type="date"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Metrics</Label>
            <div className="grid sm:grid-cols-2 gap-2">
              {METRICS.map((m) => (
                <label key={m.id} className="flex items-center gap-2 text-sm cursor-pointer">
                  <Checkbox
                    checked={selected[m.id]}
                    onCheckedChange={(v) => setSelected((s) => ({ ...s, [m.id]: Boolean(v) }))}
                  />
                  {m.label}
                </label>
              ))}
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Chart type (first selected series)</Label>
              <Select value={chartType} onValueChange={(v) => setChartType(v as "bar" | "line")}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="bar">Bar</SelectItem>
                  <SelectItem value="line">Line</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end gap-2 flex-wrap">
              <Button onClick={() => void run()} disabled={loading}>
                {loading ? "Running…" : "Run report"}
              </Button>
              <Button variant="outline" onClick={exportCsv} disabled={!result}>
                <Download className="h-4 w-4 mr-1" />
                CSV
              </Button>
              <Button variant="outline" onClick={() => void exportExcel()} disabled={!result}>
                <FileSpreadsheet className="h-4 w-4 mr-1" />
                Excel
              </Button>
              <Button variant="outline" onClick={() => void exportPdf()} disabled={!result}>
                <FileText className="h-4 w-4 mr-1" />
                PDF
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {result && (
        <Card>
          <CardHeader>
            <CardTitle>Preview</CardTitle>
            <CardDescription>
              {firstSeriesKey ?? "—"} · summary: {JSON.stringify(result.summary)}
            </CardDescription>
          </CardHeader>
          <CardContent className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              {chartType === "bar" ? (
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" className="opacity-40" />
                  <XAxis dataKey="label" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="value" fill="var(--wl-primary, #3456FF)" name="Value" />
                </BarChart>
              ) : (
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" className="opacity-40" />
                  <XAxis dataKey="label" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="value" stroke="var(--wl-primary, #3456FF)" name="Value" />
                </LineChart>
              )}
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
