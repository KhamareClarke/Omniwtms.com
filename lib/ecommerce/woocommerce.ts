import { appendSyncLog } from "@/lib/ecommerce/log";
import type { IntegrationRow, SyncResult } from "@/lib/ecommerce/types";

function wooBaseUrl(integration: IntegrationRow): string {
  const raw = String(integration.shop_identifier ?? "").replace(/\/$/, "");
  if (!raw) throw new Error("WooCommerce base URL missing");
  return raw.startsWith("http") ? raw : `https://${raw}`;
}

function wooAuthHeaders(integration: IntegrationRow): HeadersInit {
  const key = process.env.WOOCOMMERCE_CONSUMER_KEY?.trim() ?? integration.access_token;
  const secret = process.env.WOOCOMMERCE_CONSUMER_SECRET?.trim() ?? integration.refresh_token;
  if (!key || !secret) throw new Error("WooCommerce credentials missing");
  const token = Buffer.from(`${key}:${secret}`).toString("base64");
  return { Authorization: `Basic ${token}`, "Content-Type": "application/json" };
}

export async function getWooProducts(tenantId: string, integration: IntegrationRow): Promise<unknown[]> {
  try {
    const base = wooBaseUrl(integration);
    const res = await fetch(`${base}/wp-json/wc/v3/products?per_page=20`, {
      headers: wooAuthHeaders(integration),
    });
    if (!res.ok) throw new Error(await res.text());
    return (await res.json()) as unknown[];
  } catch (e) {
    const msg = e instanceof Error ? e.message : "woo products failed";
    await appendSyncLog({
      tenantId,
      integrationId: integration.id,
      provider: "woocommerce",
      level: "error",
      action: "getWooProducts",
      detail: { error: msg },
    });
    return [];
  }
}

export async function syncWooOrders(tenantId: string, integration: IntegrationRow): Promise<SyncResult> {
  await appendSyncLog({
    tenantId,
    integrationId: integration.id,
    provider: "woocommerce",
    action: "sync_woo_orders",
    detail: { note: "Map wc/v3/orders into OmniWTMS orders in a follow-up iteration." },
  });
  return { ok: true, synced: 0 };
}

export async function syncWooInventory(tenantId: string, integration: IntegrationRow): Promise<SyncResult> {
  await getWooProducts(tenantId, integration);
  await appendSyncLog({
    tenantId,
    integrationId: integration.id,
    provider: "woocommerce",
    action: "sync_woo_inventory",
    detail: { note: "Stub — stock push via wc/v3/products/batch." },
  });
  return { ok: true, synced: 0 };
}
