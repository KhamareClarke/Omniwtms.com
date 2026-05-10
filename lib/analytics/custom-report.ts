import { admin } from "@/lib/analytics/internal";

export type CustomReportMetric =
  | "orders_volume"
  | "deliveries_status"
  | "warehouse_utilization"
  | "inventory_movements"
  | "revenue_proxy";

export type CustomReportRequest = {
  metrics: CustomReportMetric[];
  dateFrom: string;
  dateTo: string;
  warehouseId?: string | null;
};

export type CustomReportSeriesPoint = { label: string; value: number; group?: string };

export type CustomReportResult = {
  series: Record<string, CustomReportSeriesPoint[]>;
  summary: Record<string, number>;
};

export async function buildCustomReport(tenantId: string, req: CustomReportRequest): Promise<CustomReportResult> {
  const supabase = admin();
  const series: Record<string, CustomReportSeriesPoint[]> = {};
  const summary: Record<string, number> = {};
  const from = req.dateFrom;
  const to = req.dateTo;

  if (req.metrics.includes("orders_volume")) {
    const pts: CustomReportSeriesPoint[] = [];
    let total = 0;
    try {
      const { data } = await supabase
        .from("orders")
        .select("created_at")
        .eq("tenant_id", tenantId)
        .gte("created_at", from)
        .lte("created_at", to);
      const byDay = new Map<string, number>();
      for (const r of (data ?? []) as { created_at?: string }[]) {
        const day = (r.created_at ?? "").slice(0, 10);
        if (!day) continue;
        byDay.set(day, (byDay.get(day) ?? 0) + 1);
      }
      for (const [label, value] of [...byDay.entries()].sort((a, b) => a[0].localeCompare(b[0]))) {
        pts.push({ label, value });
        total += value;
      }
    } catch {
      /* skip */
    }
    series.orders_volume = pts;
    summary.orders_volume = total;
  }

  if (req.metrics.includes("deliveries_status")) {
    const pts: CustomReportSeriesPoint[] = [];
    try {
      let q = supabase
        .from("deliveries")
        .select("status")
        .eq("tenant_id", tenantId)
        .gte("created_at", from)
        .lte("created_at", to);
      if (req.warehouseId) q = q.eq("warehouse_id", req.warehouseId);
      const { data } = await q;
      const by = new Map<string, number>();
      for (const r of (data ?? []) as { status?: string }[]) {
        const s = String(r.status ?? "unknown");
        by.set(s, (by.get(s) ?? 0) + 1);
      }
      for (const [label, value] of by.entries()) pts.push({ label, value });
    } catch {
      /* skip */
    }
    series.deliveries_status = pts;
    summary.deliveries_status = pts.reduce((a, p) => a + p.value, 0);
  }

  if (req.metrics.includes("warehouse_utilization")) {
    const pts: CustomReportSeriesPoint[] = [];
    try {
      let q = supabase.from("warehouses").select("id, name, utilization, capacity").eq("tenant_id", tenantId);
      const { data } = await q;
      for (const w of (data ?? []) as {
        id?: string;
        name?: string;
        utilization?: number | string | null;
        capacity?: number | null;
      }[]) {
        const v = Number(w.utilization ?? 0);
        pts.push({ label: w.name ?? w.id ?? "—", value: Number.isFinite(v) ? Math.min(100, v) : 0 });
      }
    } catch {
      /* skip */
    }
    series.warehouse_utilization = pts;
    summary.warehouse_utilization = pts.length ? pts.reduce((a, p) => a + p.value, 0) / pts.length : 0;
  }

  if (req.metrics.includes("inventory_movements")) {
    const pts: CustomReportSeriesPoint[] = [];
    try {
      let q = supabase
        .from("inventory_movements")
        .select("movement_type, timestamp")
        .gte("timestamp", from)
        .lte("timestamp", to);
      if (req.warehouseId) q = q.eq("warehouse_id", req.warehouseId);
      const { data } = await q.limit(5000);
      const by = new Map<string, number>();
      for (const r of (data ?? []) as { movement_type?: string }[]) {
        const t = String(r.movement_type ?? "unknown");
        by.set(t, (by.get(t) ?? 0) + 1);
      }
      for (const [label, value] of by.entries()) pts.push({ label, value });
    } catch {
      /* skip */
    }
    series.inventory_movements = pts;
    summary.inventory_movements = pts.reduce((a, p) => a + p.value, 0);
  }

  if (req.metrics.includes("revenue_proxy")) {
    const pts: CustomReportSeriesPoint[] = [];
    try {
      const { data } = await supabase
        .from("deliveries")
        .select("created_at")
        .eq("tenant_id", tenantId)
        .eq("status", "completed")
        .gte("created_at", from)
        .lte("created_at", to);
      const byDay = new Map<string, number>();
      for (const r of (data ?? []) as { created_at?: string }[]) {
        const day = (r.created_at ?? "").slice(0, 10);
        if (!day) continue;
        byDay.set(day, (byDay.get(day) ?? 0) + 1);
      }
      for (const [label, value] of [...byDay.entries()].sort((a, b) => a[0].localeCompare(b[0]))) {
        const proxy = value * 42.5;
        pts.push({ label, value: Math.round(proxy * 100) / 100 });
      }
    } catch {
      /* skip */
    }
    series.revenue_proxy = pts;
    summary.revenue_proxy = pts.reduce((a, p) => a + p.value, 0);
  }

  return { series, summary };
}
