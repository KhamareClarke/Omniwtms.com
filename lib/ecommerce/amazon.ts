import { appendSyncLog } from "@/lib/ecommerce/log";
import type { IntegrationRow, SyncResult } from "@/lib/ecommerce/types";

/**
 * Amazon Selling Partner API — scaffold.
 * Configure `AMAZON_REFRESH_TOKEN`, `AMAZON_CLIENT_ID`, `AMAZON_CLIENT_SECRET`, `AMAZON_AWS_*` for live calls.
 */
export async function getAmazonOrders(_tenantId: string, _integration: IntegrationRow): Promise<unknown[]> {
  const missing = !process.env.AMAZON_REFRESH_TOKEN?.trim();
  if (missing) {
    await appendSyncLog({
      tenantId: _tenantId,
      integrationId: _integration.id,
      provider: "amazon",
      level: "warn",
      action: "getAmazonOrders",
      detail: { message: "Amazon SP-API credentials not configured" },
    });
    return [];
  }
  return [];
}

export async function syncAmazonOrders(tenantId: string, integration: IntegrationRow): Promise<SyncResult> {
  await getAmazonOrders(tenantId, integration);
  await appendSyncLog({
    tenantId,
    integrationId: integration.id,
    provider: "amazon",
    action: "sync_amazon_orders",
    detail: { note: "Stub — implement Orders API v0 with LWA token rotation." },
  });
  return { ok: true, synced: 0 };
}

export async function updateAmazonInventory(tenantId: string, integration: IntegrationRow): Promise<SyncResult> {
  await appendSyncLog({
    tenantId,
    integrationId: integration.id,
    provider: "amazon",
    action: "update_amazon_inventory",
    detail: { note: "Stub — FBA/FBM feeds not invoked." },
  });
  return { ok: true, synced: 0 };
}
