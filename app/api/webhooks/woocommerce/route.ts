import { NextRequest, NextResponse } from "next/server";
import { createHmac, timingSafeEqual } from "crypto";
import { createAdminServiceClient } from "@/lib/supabase/admin-service";
import { appendSyncLog } from "@/lib/ecommerce/log";

function verifyWooSignature(rawBody: string, signature: string | null, secret: string): boolean {
  if (!signature || !secret) return false;
  const digest = createHmac("sha256", secret).update(rawBody, "utf8").digest("base64");
  try {
    const a = Buffer.from(digest);
    const b = Buffer.from(signature);
    return a.length === b.length && timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.text();
    const sig = request.headers.get("x-wc-webhook-signature");
    const secret = process.env.WOOCOMMERCE_WEBHOOK_SECRET?.trim();
    if (secret && !verifyWooSignature(rawBody, sig, secret)) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    const topic = request.headers.get("x-wc-webhook-topic") ?? "unknown";
    const source = request.headers.get("x-wc-webhook-source") ?? "";

    const supabase = createAdminServiceClient();
    const { data: rows } = await supabase
      .from("ecommerce_integrations")
      .select("id, tenant_id")
      .eq("provider", "woocommerce")
      .limit(1);
    const hit = (rows ?? [])[0] as { id?: string; tenant_id?: string } | undefined;
    if (hit?.tenant_id) {
      await appendSyncLog({
        tenantId: hit.tenant_id,
        integrationId: hit.id ?? null,
        provider: "woocommerce",
        action: `webhook:${topic}`,
        detail: { source: source.slice(0, 120) },
      });
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("webhook woocommerce", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
