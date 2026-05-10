import { createAdminServiceClient } from "@/lib/supabase/admin-service";

export type BillingLimits = {
  max_api_calls_per_month: number | null;
  max_storage_gb: number | null;
  max_orders_per_month: number | null;
  max_deliveries_per_month: number | null;
};

function monthRangeUtc(anchor: Date): { start: string; end: string } {
  const y = anchor.getUTCFullYear();
  const m = anchor.getUTCMonth();
  const start = new Date(Date.UTC(y, m, 1));
  const end = new Date(Date.UTC(y, m + 1, 0));
  const iso = (d: Date) => d.toISOString().slice(0, 10);
  return { start: iso(start), end: iso(end) };
}

/** Count rows in tenant_api_request_logs for the calendar month of `anchor` (UTC). */
export async function countAPICallsThisMonth(tenantId: string, anchor: Date = new Date()): Promise<number> {
  const supabase = createAdminServiceClient();
  const { start, end } = monthRangeUtc(anchor);
  const { count, error } = await supabase
    .from("tenant_api_request_logs")
    .select("id", { count: "exact", head: true })
    .eq("tenant_id", tenantId)
    .gte("created_at", `${start}T00:00:00.000Z`)
    .lte("created_at", `${end}T23:59:59.999Z`);
  if (error) {
    console.error("countAPICallsThisMonth", error);
    return 0;
  }
  return count ?? 0;
}

/**
 * Storage used (GB): prefers RPC `tenant_storage_used_gb` (storage.objects × warehouses).
 * Falls back to POD heuristic if the RPC is missing or returns null.
 */
export async function getStorageUsedGB(tenantId: string): Promise<number> {
  const supabase = createAdminServiceClient();
  const { data: rpcData, error: rpcErr } = await supabase.rpc("tenant_storage_used_gb", {
    p_tenant_id: tenantId,
  });
  if (!rpcErr && rpcData != null && !Number.isNaN(Number(rpcData))) {
    const gb = Number(rpcData);
    return Math.round(gb * 10000) / 10000;
  }

  const { count, error } = await supabase
    .from("deliveries")
    .select("id", { count: "exact", head: true })
    .eq("tenant_id", tenantId)
    .not("pod_file", "is", null);
  if (error) {
    console.error("getStorageUsedGB", error);
    return 0;
  }
  const mb = (count ?? 0) * 0.5;
  return Math.round((mb / 1024) * 10000) / 10000;
}

export async function countOrdersThisMonth(tenantId: string, anchor: Date = new Date()): Promise<number> {
  const supabase = createAdminServiceClient();
  const since = new Date(Date.UTC(anchor.getUTCFullYear(), anchor.getUTCMonth(), 1));
  const { data: customers, error: cErr } = await supabase.from("customers").select("id").eq("tenant_id", tenantId);
  if (cErr || !customers?.length) {
    if (cErr) console.error("countOrdersThisMonth customers", cErr);
    return 0;
  }
  const ids = (customers as { id: string }[]).map((c) => c.id);
  const { count, error } = await supabase
    .from("simple_orders")
    .select("id", { count: "exact", head: true })
    .in("customer_id", ids)
    .gte("created_at", since.toISOString());
  if (error) {
    console.error("countOrdersThisMonth", error);
    return 0;
  }
  return count ?? 0;
}

export async function countDeliveriesThisMonth(tenantId: string, anchor: Date = new Date()): Promise<number> {
  const supabase = createAdminServiceClient();
  const since = new Date(Date.UTC(anchor.getUTCFullYear(), anchor.getUTCMonth(), 1));
  const { count, error } = await supabase
    .from("deliveries")
    .select("id", { count: "exact", head: true })
    .eq("tenant_id", tenantId)
    .gte("created_at", since.toISOString());
  if (error) {
    console.error("countDeliveriesThisMonth", error);
    return 0;
  }
  return count ?? 0;
}

export type OverageBreakdown = {
  apiCallsOver: number;
  apiChargeGbp: number;
  storageOverGb: number;
  storageChargeGbp: number;
  ordersOver: number;
  ordersChargeGbp: number;
  deliveriesOver: number;
  deliveriesChargeGbp: number;
  totalGbp: number;
};

/** £0.01 per 1000 API calls over limit; £0.10 per GB storage over; £0.02 per order/delivery over (aligned to transport volume). */
export function calculateOverageCharges(
  usage: {
    apiCalls: number;
    storageGb: number;
    orders: number;
    deliveries: number;
  },
  limits: BillingLimits
): OverageBreakdown {
  const apiCallsOver =
    limits.max_api_calls_per_month == null ? 0 : Math.max(0, usage.apiCalls - limits.max_api_calls_per_month);
  const apiChargeGbp = (apiCallsOver / 1000) * 0.01;

  const storageOverGb =
    limits.max_storage_gb == null ? 0 : Math.max(0, usage.storageGb - limits.max_storage_gb);
  const storageChargeGbp = storageOverGb * 0.1;

  const ordersCap = limits.max_orders_per_month;
  const ordersOver = ordersCap == null ? 0 : Math.max(0, usage.orders - ordersCap);
  const ordersChargeGbp = ordersOver * 0.02;

  const delCap = limits.max_deliveries_per_month ?? limits.max_orders_per_month;
  const deliveriesOver = delCap == null ? 0 : Math.max(0, usage.deliveries - delCap);
  const deliveriesChargeGbp = deliveriesOver * 0.02;

  const totalGbp =
    Math.round((apiChargeGbp + storageChargeGbp + ordersChargeGbp + deliveriesChargeGbp) * 10000) / 10000;

  return {
    apiCallsOver,
    apiChargeGbp,
    storageOverGb,
    storageChargeGbp,
    ordersOver,
    ordersChargeGbp,
    deliveriesOver,
    deliveriesChargeGbp,
    totalGbp,
  };
}

/** Optional: call from API middleware or gateway to populate usage counts. */
export async function logTenantApiCall(tenantId: string, path: string, method: string): Promise<void> {
  const supabase = createAdminServiceClient();
  await supabase.from("tenant_api_request_logs").insert({
    tenant_id: tenantId,
    path: path.slice(0, 512),
    method: method.slice(0, 16),
  });
}

export async function getUsageSnapshot(tenantId: string, anchor: Date = new Date()) {
  const [apiCalls, storageGb, orders, deliveries] = await Promise.all([
    countAPICallsThisMonth(tenantId, anchor),
    getStorageUsedGB(tenantId),
    countOrdersThisMonth(tenantId, anchor),
    countDeliveriesThisMonth(tenantId, anchor),
  ]);
  return { apiCalls, storageGb, orders, deliveries, anchor, monthStart: monthRangeUtc(anchor).start };
}
