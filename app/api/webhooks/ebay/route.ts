import { NextRequest, NextResponse } from "next/server";
import { createAdminServiceClient } from "@/lib/supabase/admin-service";
import { appendSyncLog } from "@/lib/ecommerce/log";

/** eBay marketplace account deletion / notification endpoint (simplified). */
export async function POST(request: NextRequest) {
  try {
    const text = await request.text();
    let meta: Record<string, unknown> = {};
    try {
      meta = JSON.parse(text) as Record<string, unknown>;
    } catch {
      meta = { raw: text.slice(0, 500) };
    }

    const supabase = createAdminServiceClient();
    const { data: rows } = await supabase
      .from("ecommerce_integrations")
      .select("id, tenant_id")
      .eq("provider", "ebay")
      .limit(1);

    const hit = (rows ?? [])[0] as { id?: string; tenant_id?: string } | undefined;
    if (hit?.tenant_id) {
      await appendSyncLog({
        tenantId: hit.tenant_id,
        integrationId: hit.id ?? null,
        provider: "ebay",
        action: "webhook:notification",
        detail: { keys: Object.keys(meta) },
      });
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("webhook ebay", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
