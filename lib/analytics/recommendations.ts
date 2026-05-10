import {
  getWarehouseMetrics,
  listWarehousesForTenant,
  type WarehouseMetrics,
} from "@/lib/analytics/warehouse-metrics";
import { admin } from "@/lib/analytics/internal";
import {
  forecastOrdersNextWeek,
  predictPeakHours,
  forecastInventory,
  calculateDelayRisk,
  getOrderVolumeByDay,
  type OrderForecast,
  type PeakHour,
  type InventoryForecastRow,
  type DelayRisk,
  type DailyCount,
} from "@/lib/analytics/predictions";
export type RecommendationSeverity = "info" | "warning" | "critical";

export type Recommendation = {
  id: string;
  title: string;
  body: string;
  severity: RecommendationSeverity;
  category: "inventory" | "operations" | "capacity" | "cost" | "quality";
};

export type AnalyticsBundle = {
  tenant_id: string;
  warehouse_id: string | null;
  warehouses: { id: string; name: string }[];
  metrics: WarehouseMetrics | null;
  forecast: OrderForecast;
  peak_hours: PeakHour[];
  inventory_forecast: InventoryForecastRow[];
  delay_risk: DelayRisk;
  order_activity: DailyCount[];
  recommendations: Recommendation[];
};

function buildRecommendations(
  metrics: WarehouseMetrics | null,
  invForecast: InventoryForecastRow[],
  delay: DelayRisk,
  forecast: OrderForecast,
  peaks: PeakHour[]
): Recommendation[] {
  const recs: Recommendation[] = [];

  if (metrics) {
    if (metrics.inventory_accuracy < 0.92) {
      recs.push({
        id: "inv-accuracy",
        title: "Tighten cycle counts",
        body: `Inventory accuracy is about ${(metrics.inventory_accuracy * 100).toFixed(1)}%. Schedule ABC cycle counts on fast movers and reconcile adjustments.`,
        severity: "warning",
        category: "inventory",
      });
    }
    if (metrics.pending_deliveries > 15) {
      recs.push({
        id: "pending-del",
        title: "Delivery backlog building",
        body: `${metrics.pending_deliveries} pending deliveries tied to the primary warehouse. Consider extra courier capacity or staggered pickup windows.`,
        severity: metrics.pending_deliveries > 40 ? "critical" : "warning",
        category: "operations",
      });
    }
    if (metrics.on_time_delivery_rate < 0.88) {
      recs.push({
        id: "otd",
        title: "On-time delivery under target",
        body: `On-time rate is ${(metrics.on_time_delivery_rate * 100).toFixed(0)}%. Review route planning buffers and SLA commitments for this warehouse.`,
        severity: "warning",
        category: "operations",
      });
    }
    if (metrics.cost_per_delivery > 22) {
      recs.push({
        id: "cpd",
        title: "Cost per delivery elevated",
        body: `Estimated cost per delivery is £${metrics.cost_per_delivery.toFixed(2)}. Batch stops, reduce dead miles, and review carrier mix.`,
        severity: "info",
        category: "cost",
      });
    }
    if (metrics.avg_pick_time_minutes > 180) {
      recs.push({
        id: "pick-time",
        title: "Pick cycle time high",
        body: `Average pick-to-ship is ${metrics.avg_pick_time_minutes} minutes. Check slotting, pick paths, and wave planning.`,
        severity: "warning",
        category: "operations",
      });
    }
  }

  for (const row of invForecast.filter((r) => r.suggested_reorder > 0 && r.current_qty < 10).slice(0, 3)) {
    recs.push({
      id: `low-stock-${row.product_id ?? row.name}`,
      title: `Low stock: ${row.name}`,
      body: `On-hand ${row.current_qty}. Projected 7d demand ~${row.forecast_7d_demand} units — suggest reorder ~${row.suggested_reorder} units.`,
      severity: row.current_qty === 0 ? "critical" : "warning",
      category: "inventory",
    });
  }

  if (delay.level !== "low") {
    recs.push({
      id: "delay-risk",
      title: "Delay risk elevated",
      body: `${delay.factors.join(" ")} (score ${delay.score}).`,
      severity: delay.level === "high" ? "critical" : "warning",
      category: "operations",
    });
  }

  if (forecast.method === "linear_trend" && forecast.next_week_total > 0) {
    recs.push({
      id: "demand-up",
      title: "Demand uptick expected",
      body: `Linear trend projects ~${forecast.next_week_total} order-equivalent events next week. Pre-stage labor and inbound slots.`,
      severity: "info",
      category: "capacity",
    });
  }

  if (peaks.length) {
    recs.push({
      id: "peak-hours",
      title: "Staff peak windows",
      body: `Busiest creation hours (UTC): ${peaks.map((p) => p.label).join(", ")}. Align dispatch and yard teams accordingly.`,
      severity: "info",
      category: "capacity",
    });
  }

  if (recs.length === 0) {
    recs.push({
      id: "all-clear",
      title: "No critical issues detected",
      body: "Metrics look stable. Re-run after major operational changes or weekly as part of your governance cadence.",
      severity: "info",
      category: "quality",
    });
  }

  return recs.slice(0, 12);
}

export async function getAnalyticsBundle(
  tenantId: string,
  preferredWarehouseId?: string | null
): Promise<AnalyticsBundle> {
  const supabase = admin();
  const warehouses = await listWarehousesForTenant(supabase, tenantId);
  const wid =
    preferredWarehouseId && warehouses.some((w) => w.id === preferredWarehouseId)
      ? preferredWarehouseId
      : warehouses[0]?.id ?? null;

  const [metrics, forecast, peaks, invForecast, delayRisk, order_activity] = await Promise.all([
    wid ? getWarehouseMetrics(tenantId, wid) : Promise.resolve(null),
    forecastOrdersNextWeek(tenantId),
    predictPeakHours(tenantId),
    forecastInventory(tenantId),
    calculateDelayRisk(tenantId),
    getOrderVolumeByDay(tenantId, 14),
  ]);

  const recommendations = buildRecommendations(metrics, invForecast, delayRisk, forecast, peaks);

  return {
    tenant_id: tenantId,
    warehouse_id: wid,
    warehouses,
    metrics,
    forecast,
    peak_hours: peaks,
    inventory_forecast: invForecast.slice(0, 20),
    delay_risk: delayRisk,
    order_activity,
    recommendations,
  };
}

/** Rule-based suggestions (same data as {@link getAnalyticsBundle}). */
export async function generateRecommendations(tenantId: string): Promise<Recommendation[]> {
  const b = await getAnalyticsBundle(tenantId);
  return b.recommendations;
}
