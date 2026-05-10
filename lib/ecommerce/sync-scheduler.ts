import { createAdminServiceClient } from "@/lib/supabase/admin-service";
import type { IntegrationRow } from "@/lib/ecommerce/types";
import { syncShopifyProducts, syncShopifyOrders, syncShopifyInventory } from "@/lib/ecommerce/shopify";
import { syncAmazonOrders, updateAmazonInventory } from "@/lib/ecommerce/amazon";
import { syncEbayOrders, updateEbaySoldQuantity } from "@/lib/ecommerce/ebay";
import { syncWooOrders, syncWooInventory } from "@/lib/ecommerce/woocommerce";
import { appendSyncLog } from "@/lib/ecommerce/log";

async function syncOne(integration: IntegrationRow): Promise<{ ok: boolean; error?: string }> {
  const tenantId = integration.tenant_id;
  const row = integration;
  try {
    switch (row.provider) {
      case "shopify":
        if (!row.access_token) return { ok: false, error: "Shopify not connected" };
        await syncShopifyProducts(tenantId, row);
        await syncShopifyOrders(tenantId, row);
        await syncShopifyInventory(tenantId, row);
        break;
      case "amazon":
        await syncAmazonOrders(tenantId, row);
        await updateAmazonInventory(tenantId, row);
        break;
      case "ebay":
        await syncEbayOrders(tenantId, row);
        await updateEbaySoldQuantity(tenantId, row);
        break;
      case "woocommerce":
        await syncWooOrders(tenantId, row);
        await syncWooInventory(tenantId, row);
        break;
      default:
        return { ok: false, error: "unknown provider" };
    }
    const supabase = createAdminServiceClient();
    await supabase
      .from("ecommerce_integrations")
      .update({
        last_sync_at: new Date().toISOString(),
        last_error: null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", row.id);
    return { ok: true };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "sync error";
    const supabase = createAdminServiceClient();
    await supabase
      .from("ecommerce_integrations")
      .update({ last_error: msg, updated_at: new Date().toISOString() })
      .eq("id", row.id);
    await appendSyncLog({
      tenantId,
      integrationId: row.id,
      provider: row.provider,
      level: "error",
      action: "scheduled_sync",
      detail: { error: msg },
    });
    return { ok: false, error: msg };
  }
}

/** Hourly job: sync all connected stores (invoked from Vercel Cron). */
export async function runHourlyEcommerceSyncAllTenants(): Promise<{
  ok: boolean;
  processed: number;
  errors: string[];
}> {
  const supabase = createAdminServiceClient();
  const { data, error } = await supabase
    .from("ecommerce_integrations")
    .select("*")
    .eq("status", "connected");
  if (error) {
    return { ok: false, processed: 0, errors: [error.message] };
  }
  const errors: string[] = [];
  let processed = 0;
  for (const raw of data ?? []) {
    const r = raw as IntegrationRow;
    const res = await syncOne(r);
    processed += 1;
    if (!res.ok && res.error) errors.push(`${r.id}: ${res.error}`);
  }
  return { ok: true, processed, errors };
}
