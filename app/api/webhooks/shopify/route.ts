import { NextRequest, NextResponse } from "next/server";
import { createAdminServiceClient } from "@/lib/supabase/admin-service";
import { verifyShopifyWebhook } from "@/lib/ecommerce/shopify";
import { appendSyncLog } from "@/lib/ecommerce/log";

export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.text();
    const hmac = request.headers.get("X-Shopify-Hmac-Sha256");
    if (!verifyShopifyWebhook(rawBody, hmac)) {
      return NextResponse.json({ error: "Invalid HMAC" }, { status: 401 });
    }

    const shop = request.headers.get("X-Shopify-Shop-Domain")?.trim();
    const topic = request.headers.get("X-Shopify-Topic")?.trim() ?? "unknown";
    if (!shop) {
      return NextResponse.json({ error: "Missing shop" }, { status: 400 });
    }

    const supabase = createAdminServiceClient();
    const { data: row } = await supabase
      .from("ecommerce_integrations")
      .select("id, tenant_id")
      .eq("provider", "shopify")
      .eq("shop_identifier", shop)
      .maybeSingle();

    const hit = row as { id?: string; tenant_id?: string } | null;
    if (hit?.tenant_id) {
      let payload: Record<string, unknown> = {};
      try {
        payload = JSON.parse(rawBody) as Record<string, unknown>;
      } catch {
        payload = { raw: true };
      }
      await appendSyncLog({
        tenantId: hit.tenant_id,
        integrationId: hit.id ?? null,
        provider: "shopify",
        action: `webhook:${topic}`,
        detail: { keys: Object.keys(payload).slice(0, 20) },
      });
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("webhook shopify", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
