import { createHmac, timingSafeEqual } from "crypto";
import { createAdminServiceClient } from "@/lib/supabase/admin-service";
import { appendSyncLog } from "@/lib/ecommerce/log";
import type { IntegrationRow, SyncResult } from "@/lib/ecommerce/types";

const SHOPIFY_SCOPES =
  "read_products,write_products,read_orders,write_orders,read_inventory,write_inventory";

export function shopifyAuthUrl(params: { shop: string; redirectUri: string; state: string }): string {
  const clientId = process.env.SHOPIFY_CLIENT_ID?.trim();
  if (!clientId) {
    throw new Error("SHOPIFY_CLIENT_ID is not configured");
  }
  const shop = params.shop.replace(/^https?:\/\//, "").replace(/\/$/, "");
  const u = new URL(`https://${shop}/admin/oauth/authorize`);
  u.searchParams.set("client_id", clientId);
  u.searchParams.set("scope", SHOPIFY_SCOPES);
  u.searchParams.set("redirect_uri", params.redirectUri);
  u.searchParams.set("state", params.state);
  return u.toString();
}

export async function exchangeShopifyOAuthCode(
  shop: string,
  code: string
): Promise<{ access_token: string; scope: string }> {
  const clientId = process.env.SHOPIFY_CLIENT_ID?.trim();
  const clientSecret = process.env.SHOPIFY_CLIENT_SECRET?.trim();
  if (!clientId || !clientSecret) throw new Error("Shopify OAuth env missing");
  const host = shop.replace(/^https?:\/\//, "").replace(/\/$/, "");
  const res = await fetch(`https://${host}/admin/oauth/access_token`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ client_id: clientId, client_secret: clientSecret, code }),
  });
  if (!res.ok) throw new Error(`Shopify token exchange failed: ${res.status}`);
  const body = (await res.json()) as { access_token?: string; scope?: string };
  if (!body.access_token) throw new Error("Shopify token missing");
  return { access_token: body.access_token, scope: body.scope ?? "" };
}

function shopifyRest(integration: IntegrationRow, path: string, init?: RequestInit) {
  const shop = String(integration.shop_identifier ?? "").replace(/^https?:\/\//, "").replace(/\/$/, "");
  const token = integration.access_token;
  if (!shop || !token) throw new Error("Shopify integration not connected");
  const url = `https://${shop}/admin/api/2024-01${path}`;
  return fetch(url, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      "X-Shopify-Access-Token": token,
      ...(init?.headers as Record<string, string>),
    },
  });
}

export async function syncShopifyProducts(tenantId: string, integration: IntegrationRow): Promise<SyncResult> {
  try {
    const supabase = createAdminServiceClient();
    let synced = 0;
    let url: string | null = "/products.json?limit=50";
    while (url) {
      const res = await shopifyRest(integration, url);
      if (!res.ok) return { ok: false, error: await res.text() };
      const data = (await res.json()) as {
        products?: { id: number; title: string; variants?: { sku?: string }[] }[];
      };
      const products = data.products ?? [];
      for (const p of products) {
        const sku = p.variants?.[0]?.sku || `shopify-${p.id}`;
        const code = `${tenantId.slice(0, 8)}-${String(sku).replace(/\s+/g, "-").slice(0, 60)}`;
        const { error } = await supabase.from("skus").upsert(
          {
            code,
            name: (p.title?.slice(0, 200) ?? code).slice(0, 200),
            category: "ecommerce",
            description: `Shopify product ${p.id}`,
            tenant_id: tenantId,
          },
          { onConflict: "code" }
        );
        if (!error) synced += 1;
      }
      const link = res.headers.get("link");
      url = null;
      if (link?.includes('rel="next"')) {
        const m = link.match(/<([^>]+)>;\s*rel="next"/);
        if (m?.[1]) {
          const nu = new URL(m[1]);
          url = `${nu.pathname}${nu.search}`;
        }
      }
    }
    await appendSyncLog({
      tenantId,
      integrationId: integration.id,
      provider: "shopify",
      action: "sync_products",
      detail: { synced },
    });
    return { ok: true, synced };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "sync failed";
    await appendSyncLog({
      tenantId,
      integrationId: integration.id,
      provider: "shopify",
      level: "error",
      action: "sync_products",
      detail: { error: msg },
    });
    return { ok: false, error: msg };
  }
}

export async function syncShopifyOrders(tenantId: string, integration: IntegrationRow): Promise<SyncResult> {
  try {
    const supabase = createAdminServiceClient();
    const res = await shopifyRest(integration, "/orders.json?status=any&limit=50");
    if (!res.ok) return { ok: false, error: await res.text() };
    const data = (await res.json()) as { orders?: { id: number; name?: string; financial_status?: string }[] };
    let synced = 0;
    for (const o of data.orders ?? []) {
      const base = o.name ?? `SH-${o.id}`;
      const order_number = `${tenantId.slice(0, 8)}-${base}`.slice(0, 120);
      const statusMap: Record<string, "pending" | "processing" | "shipped" | "delivered" | "cancelled"> = {
        paid: "processing",
        pending: "pending",
        fulfilled: "shipped",
        partially_paid: "processing",
        refunded: "cancelled",
        voided: "cancelled",
        cancelled: "cancelled",
      };
      const raw = String(o.financial_status ?? "").toLowerCase();
      const status = statusMap[raw] ?? "processing";
      const { error } = await supabase.from("orders").insert({
        order_number,
        status,
        tenant_id: tenantId,
        warehouse_id: null,
      });
      if (!error) synced += 1;
    }
    await appendSyncLog({
      tenantId,
      integrationId: integration.id,
      provider: "shopify",
      action: "sync_orders",
      detail: { synced },
    });
    return { ok: true, synced };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "sync orders failed";
    return { ok: false, error: msg };
  }
}

export async function syncShopifyInventory(tenantId: string, integration: IntegrationRow): Promise<SyncResult> {
  await appendSyncLog({
    tenantId,
    integrationId: integration.id,
    provider: "shopify",
    action: "sync_inventory",
    detail: { note: "Push inventory from OmniWTMS → Shopify uses location-level inventory adjustments in a full rollout." },
  });
  return { ok: true, synced: 0 };
}

/** Verify `X-Shopify-Hmac-Sha256` for webhook raw body. */
export function verifyShopifyWebhook(rawBody: string, hmacHeader: string | null): boolean {
  const secret = process.env.SHOPIFY_CLIENT_SECRET?.trim() ?? process.env.SHOPIFY_API_SECRET?.trim();
  if (!secret || !hmacHeader) return false;
  const digest = createHmac("sha256", secret).update(rawBody, "utf8").digest("base64");
  try {
    const a = Buffer.from(digest);
    const b = Buffer.from(hmacHeader);
    return a.length === b.length && timingSafeEqual(a, b);
  } catch {
    return false;
  }
}
