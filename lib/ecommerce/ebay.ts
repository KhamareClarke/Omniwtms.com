import { appendSyncLog } from "@/lib/ecommerce/log";
import type { IntegrationRow, SyncResult } from "@/lib/ecommerce/types";

/** eBay REST — scaffold (`EBAY_CLIENT_ID`, `EBAY_CLIENT_SECRET`, `EBAY_REFRESH_TOKEN`). */
export async function getEbayListings(tenantId: string, integration: IntegrationRow): Promise<unknown[]> {
  if (!process.env.EBAY_REFRESH_TOKEN?.trim()) {
    await appendSyncLog({
      tenantId,
      integrationId: integration.id,
      provider: "ebay",
      level: "warn",
      action: "getEbayListings",
      detail: { message: "eBay OAuth env not configured" },
    });
    return [];
  }
  return [];
}

export async function syncEbayOrders(tenantId: string, integration: IntegrationRow): Promise<SyncResult> {
  await getEbayListings(tenantId, integration);
  await appendSyncLog({
    tenantId,
    integrationId: integration.id,
    provider: "ebay",
    action: "sync_ebay_orders",
    detail: { note: "Stub — wire Fulfillment API sell/fulfillment/v1/order." },
  });
  return { ok: true, synced: 0 };
}

export async function updateEbaySoldQuantity(tenantId: string, integration: IntegrationRow): Promise<SyncResult> {
  await appendSyncLog({
    tenantId,
    integrationId: integration.id,
    provider: "ebay",
    action: "update_ebay_sold_quantity",
    detail: { note: "Stub — inventory push." },
  });
  return { ok: true, synced: 0 };
}
