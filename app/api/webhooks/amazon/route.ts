import { NextRequest, NextResponse } from "next/server";
import { createAdminServiceClient } from "@/lib/supabase/admin-service";
import { appendSyncLog } from "@/lib/ecommerce/log";

/**
 * Amazon SP-API notifications / SNS-style payloads — verify signing in production.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const sellingPartnerId =
      (body as { SellingPartnerId?: string }).SellingPartnerId ??
      (body as { sellerId?: string }).sellerId ??
      "unknown";

    const supabase = createAdminServiceClient();
    const { data } = await supabase
      .from("ecommerce_integrations")
      .select("id, tenant_id, metadata")
      .eq("provider", "amazon")
      .maybeSingle();

    const hit = data as { id?: string; tenant_id?: string; metadata?: { selling_partner_id?: string } } | null;
    const metaSp = hit?.metadata?.selling_partner_id;
    if (metaSp && metaSp !== sellingPartnerId) {
      return NextResponse.json({ ok: true, ignored: true });
    }
    if (hit?.tenant_id) {
      await appendSyncLog({
        tenantId: hit.tenant_id,
        integrationId: hit.id ?? null,
        provider: "amazon",
        action: "webhook:notification",
        detail: { sellingPartnerId },
      });
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("webhook amazon", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
