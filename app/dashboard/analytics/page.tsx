"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  Activity,
  AlertTriangle,
  BarChart3,
  RefreshCw,
  Sparkles,
  TrendingUp,
} from "lucide-react";
import { toast } from "sonner";

type AnalyticsBundle = {
  warehouse_id: string | null;
  warehouses: { id: string; name: string }[];
  metrics: {
    active_orders: number;
    orders_picked_today: number;
    avg_pick_time_minutes: number;
    inventory_accuracy: number;
    pending_deliveries: number;
    on_time_delivery_rate: number;
    cost_per_delivery: number;
  } | null;
  forecast: { next_week_total: number; daily: { date: string; count: number }[]; method: string };
  peak_hours: { hour: number; label: string; score: number }[];
  order_activity: { date: string; count: number }[];
  delay_risk: { score: number; level: string; factors: string[] };
  recommendations: {
    id: string;
    title: string;
    body: string;
    severity: string;
    category: string;
  }[];
};

export default function AnalyticsPage() {
  const [loading, setLoading] = useState(true);
  const [bundle, setBundle] = useState<AnalyticsBundle | null>(null);
  const [warehouseId, setWarehouseId] = useState<string>("");

  const load = async (wid?: string | null) => {
    setLoading(true);
    try {
      const q = wid ? `?warehouseId=${encodeURIComponent(wid)}` : "";
      const res = await fetch(`/api/dashboard/analytics${q}`, { credentials: "include" });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "Failed to load analytics");
        setBundle(null);
        return;
      }
      const b = data as AnalyticsBundle;
      setBundle(b);
      setWarehouseId(b.warehouse_id ?? wid ?? "");
    } catch {
      toast.error("Network error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load(null);
  }, []);

  const m = bundle?.metrics;
  const successRate = m ? Math.round(m.on_time_delivery_rate * 100) : 0;

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <BarChart3 className="h-7 w-7 text-[var(--wl-primary)]" />
            Advanced analytics
          </h1>
          <p className="text-muted-foreground mt-1">
            Live warehouse KPIs, forecasts, and rule-based recommendations.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Select
            value={warehouseId || (bundle?.warehouses?.[0]?.id ?? "")}
            onValueChange={(v) => void load(v)}
          >
            <SelectTrigger className="w-[220px]">
              <SelectValue placeholder="Warehouse" />
            </SelectTrigger>
            <SelectContent>
              {(bundle?.warehouses ?? []).map((w) => (
                <SelectItem key={w.id} value={w.id}>
                  {w.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" size="icon" onClick={() => void load(warehouseId)} disabled={loading}>
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </Button>
          <Button asChild variant="secondary">
            <Link href="/dashboard/reports/custom-report">Custom report</Link>
          </Button>
        </div>
      </div>

      {loading && !bundle ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Active orders</CardDescription>
                <CardTitle className="text-3xl">{m?.active_orders ?? "—"}</CardTitle>
              </CardHeader>
              <CardContent className="text-xs text-muted-foreground">Pending + processing</CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Picked today</CardDescription>
                <CardTitle className="text-3xl">{m?.orders_picked_today ?? "—"}</CardTitle>
              </CardHeader>
              <CardContent className="text-xs text-muted-foreground">Ship transactions / shipped orders</CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>On-time delivery</CardDescription>
                <CardTitle className="text-3xl">{m ? `${successRate}%` : "—"}</CardTitle>
              </CardHeader>
              <CardContent>
                <Progress value={successRate} className="h-2" />
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Cost / delivery (est.)</CardDescription>
                <CardTitle className="text-3xl">
                  {m != null ? `£${m.cost_per_delivery.toFixed(2)}` : "—"}
                </CardTitle>
              </CardHeader>
              <CardContent className="text-xs text-muted-foreground">Heuristic from volume</CardContent>
            </Card>
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Order activity (14d)
                </CardTitle>
                <CardDescription>Composite of orders, simple_orders, and deliveries</CardDescription>
              </CardHeader>
              <CardContent className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={bundle?.order_activity ?? []}>
                    <CartesianGrid strokeDasharray="3 3" className="opacity-40" />
                    <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Line type="monotone" dataKey="count" stroke="var(--wl-primary, #3456FF)" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Delay risk
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Score</span>
                  <Badge variant={bundle?.delay_risk.level === "high" ? "destructive" : "secondary"}>
                    {bundle?.delay_risk.level ?? "—"}
                  </Badge>
                </div>
                <Progress value={(bundle?.delay_risk.score ?? 0) * 100} className="h-2" />
                <ul className="text-xs text-muted-foreground list-disc pl-4 space-y-1">
                  {(bundle?.delay_risk.factors ?? []).map((f, i) => (
                    <li key={i}>{f}</li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Forecast — next 7 days</CardTitle>
                <CardDescription>{bundle?.forecast.method}</CardDescription>
              </CardHeader>
              <CardContent className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={bundle?.forecast.daily ?? []}>
                    <CartesianGrid strokeDasharray="3 3" className="opacity-40" />
                    <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 10 }} />
                    <Tooltip />
                    <Bar dataKey="count" fill="var(--wl-secondary, #5C4EFF)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Peak hours (UTC)</CardTitle>
                <CardDescription>From recent delivery timestamps</CardDescription>
              </CardHeader>
              <CardContent className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={bundle?.peak_hours ?? []}>
                    <CartesianGrid strokeDasharray="3 3" className="opacity-40" />
                    <XAxis dataKey="label" tick={{ fontSize: 10 }} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 10 }} />
                    <Tooltip />
                    <Bar dataKey="score" fill="#00C49F" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-amber-500" />
                Recommendations
              </CardTitle>
              <CardDescription>Rule-based suggestions from your tenant data</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3 md:grid-cols-2">
              {(bundle?.recommendations ?? []).map((r) => (
                <div
                  key={r.id}
                  className="rounded-lg border p-3 space-y-1 bg-card/50 hover:bg-muted/30 transition-colors"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-medium text-sm">{r.title}</span>
                    {r.severity === "critical" ? (
                      <AlertTriangle className="h-4 w-4 text-destructive shrink-0" />
                    ) : null}
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">{r.body}</p>
                  <Badge variant="outline" className="text-[10px]">
                    {r.category}
                  </Badge>
                </div>
              ))}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
