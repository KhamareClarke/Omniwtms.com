import { admin } from "@/lib/analytics/internal";

export type DailyCount = { date: string; count: number };

export type OrderForecast = {
  next_week_total: number;
  daily: DailyCount[];
  method: "linear_trend" | "insufficient_data";
};

export type PeakHour = { hour: number; label: string; score: number };

export type InventoryForecastRow = {
  sku_id: string | null;
  product_id: string | null;
  name: string;
  current_qty: number;
  forecast_7d_demand: number;
  suggested_reorder: number;
};

export type DelayRisk = {
  score: number;
  level: "low" | "medium" | "high";
  factors: string[];
};

function linearProjectNextWeek(series: number[]): { total: number; daily: DailyCount[] } {
  if (series.length < 2) {
    const v = series[0] ?? 0;
    const dayAvg = v / 7;
    const daily: DailyCount[] = [];
    const today = new Date();
    for (let i = 0; i < 7; i++) {
      const d = new Date(today);
      d.setUTCDate(d.getUTCDate() + i + 1);
      daily.push({ date: d.toISOString().slice(0, 10), count: Math.round(dayAvg * 10) / 10 });
    }
    return { total: Math.round(dayAvg * 7 * 10) / 10, daily };
  }
  const n = series.length;
  let sumX = 0;
  let sumY = 0;
  let sumXY = 0;
  let sumXX = 0;
  for (let i = 0; i < n; i++) {
    sumX += i;
    sumY += series[i]!;
    sumXY += i * series[i]!;
    sumXX += i * i;
  }
  const denom = n * sumXX - sumX * sumX || 1;
  const slope = (n * sumXY - sumX * sumY) / denom;
  const intercept = (sumY - slope * sumX) / n;
  const daily: DailyCount[] = [];
  const today = new Date();
  let total = 0;
  for (let i = 0; i < 7; i++) {
    const x = n + i;
    const y = Math.max(0, intercept + slope * x);
    const d = new Date(today);
    d.setUTCDate(d.getUTCDate() + i + 1);
    daily.push({ date: d.toISOString().slice(0, 10), count: Math.round(y * 10) / 10 });
    total += y;
  }
  return { total: Math.round(total * 10) / 10, daily };
}

/** Last N UTC calendar days order volume (simple_orders + orders + deliveries proxy). */
export async function getOrderVolumeByDay(tenantId: string, days: number): Promise<DailyCount[]> {
  const series = await dailyOrderSeries(tenantId, days);
  const out: DailyCount[] = [];
  const now = new Date();
  for (let i = 0; i < days; i++) {
    const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - (days - 1 - i)));
    out.push({ date: d.toISOString().slice(0, 10), count: series[i] ?? 0 });
  }
  return out;
}

async function dailyOrderSeries(tenantId: string, days: number): Promise<number[]> {
  const supabase = admin();
  const series: number[] = [];
  const now = new Date();
  for (let offset = days - 1; offset >= 0; offset--) {
    const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - offset));
    const start = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 0, 0, 0)).toISOString();
    const end = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 23, 59, 59)).toISOString();
    let c = 0;
    try {
      const { data: cust } = await supabase.from("customers").select("id").eq("tenant_id", tenantId);
      const custIds = ((cust ?? []) as { id: string }[]).map((x) => x.id);
      if (custIds.length) {
        const { count } = await supabase
          .from("simple_orders")
          .select("id", { count: "exact", head: true })
          .in("customer_id", custIds)
          .gte("created_at", start)
          .lte("created_at", end);
        c += count ?? 0;
      }
    } catch {
      /* ignore */
    }
    try {
      const { count } = await supabase
        .from("orders")
        .select("id", { count: "exact", head: true })
        .eq("tenant_id", tenantId)
        .gte("created_at", start)
        .lte("created_at", end);
      c += count ?? 0;
    } catch {
      /* ignore */
    }
    try {
      const { count } = await supabase
        .from("deliveries")
        .select("id", { count: "exact", head: true })
        .eq("tenant_id", tenantId)
        .gte("created_at", start)
        .lte("created_at", end);
      c += count ?? 0;
    } catch {
      /* ignore */
    }
    series.push(c);
  }
  return series;
}

export async function forecastOrdersNextWeek(tenantId: string): Promise<OrderForecast> {
  const series = await dailyOrderSeries(tenantId, 14);
  const sum = series.reduce((a, b) => a + b, 0);
  if (sum === 0) {
    return {
      next_week_total: 0,
      daily: [],
      method: "insufficient_data",
    };
  }
  const { total, daily } = linearProjectNextWeek(series);
  return { next_week_total: total, daily, method: "linear_trend" };
}

export async function predictPeakHours(tenantId: string): Promise<PeakHour[]> {
  const supabase = admin();
  const buckets = new Array(24).fill(0);
  try {
    const { data } = await supabase
      .from("deliveries")
      .select("created_at")
      .eq("tenant_id", tenantId)
      .order("created_at", { ascending: false })
      .limit(2000);
    for (const row of (data ?? []) as { created_at?: string }[]) {
      if (!row.created_at) continue;
      const h = new Date(row.created_at).getUTCHours();
      buckets[h] += 1;
    }
  } catch {
    /* empty */
  }
  const ranked = buckets
    .map((score, hour) => ({
      hour,
      label: `${String(hour).padStart(2, "0")}:00 UTC`,
      score,
    }))
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);
  if (ranked.length === 0) {
    return [
      { hour: 9, label: "09:00 UTC", score: 1 },
      { hour: 14, label: "14:00 UTC", score: 1 },
      { hour: 17, label: "17:00 UTC", score: 1 },
    ];
  }
  return ranked;
}

export async function forecastInventory(tenantId: string): Promise<InventoryForecastRow[]> {
  const supabase = admin();
  const out: InventoryForecastRow[] = [];
  try {
    const { data: clients } = await supabase.from("clients").select("id").eq("tenant_id", tenantId);
    const clientIds = ((clients ?? []) as { id: string }[]).map((c) => c.id);
    if (!clientIds.length) return out;

    const { data: products } = await supabase.from("products").select("id").in("client_id", clientIds);
    const productIds = ((products ?? []) as { id: string }[]).map((p) => p.id);
    if (!productIds.length) return out;

    const { data: inv } = await supabase
      .from("warehouse_inventory")
      .select("product_id, quantity, products(name, sku)")
      .in("product_id", productIds)
      .limit(200);

    const rows = (inv ?? []) as {
      product_id?: string;
      quantity?: number;
      products?: { name?: string; sku?: string };
    }[];

    const demandPerSku = await dailyOrderSeries(tenantId, 7);
    const avgDaily = demandPerSku.reduce((a, b) => a + b, 0) / 7 || 0;

    for (const r of rows.slice(0, 50)) {
      const qty = Number(r.quantity ?? 0);
      const name = r.products?.name ?? r.products?.sku ?? "Product";
      const forecast_7d_demand = Math.max(1, Math.round(avgDaily * 2));
      const suggested_reorder = Math.max(0, forecast_7d_demand * 2 - qty);
      out.push({
        sku_id: null,
        product_id: r.product_id ?? null,
        name,
        current_qty: qty,
        forecast_7d_demand,
        suggested_reorder,
      });
    }
  } catch {
    /* ignore */
  }
  return out;
}

export async function calculateDelayRisk(tenantId: string): Promise<DelayRisk> {
  const supabase = admin();
  const factors: string[] = [];
  let score = 0.15;

  try {
    const { count: pending } = await supabase
      .from("deliveries")
      .select("id", { count: "exact", head: true })
      .eq("tenant_id", tenantId)
      .in("status", ["pending", "in_progress", "out_for_delivery"]);
    const p = pending ?? 0;
    if (p > 30) {
      score += 0.35;
      factors.push("High volume of in-flight deliveries");
    } else if (p > 10) {
      score += 0.2;
      factors.push("Elevated in-flight delivery count");
    }
  } catch {
    factors.push("Could not read delivery backlog");
  }

  try {
    const { count: late } = await supabase
      .from("deliveries")
      .select("id", { count: "exact", head: true })
      .eq("tenant_id", tenantId)
      .not("estimated_time", "is", null)
      .lt("estimated_time", new Date().toISOString())
      .not("status", "eq", "completed");
    const l = late ?? 0;
    if (l > 0) {
      score += Math.min(0.4, l * 0.05);
      factors.push(`${l} delivery(ies) past estimated time`);
    }
  } catch {
    /* ignore */
  }

  if (factors.length === 0) factors.push("No major delay signals detected");

  score = Math.min(1, Math.max(0, score));
  const level: DelayRisk["level"] = score >= 0.55 ? "high" : score >= 0.3 ? "medium" : "low";
  return { score: Math.round(score * 100) / 100, level, factors };
}
