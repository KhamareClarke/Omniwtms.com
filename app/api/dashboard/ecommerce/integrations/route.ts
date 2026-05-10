import { NextRequest, NextResponse } from "next/server";
import { requireTenantId } from "@/lib/tenants/context";
import { createAdminServiceClient } from "@/lib/supabase/admin-service";
import type { EcommerceProvider } from "@/lib/ecommerce/types";
import { appendSyncLog } from "@/lib/ecommerce/log";

const PROVIDERS: EcommerceProvider[] = ["shopify", "amazon", "ebay", "woocommerce"];

/**
 * GET /api/dashboard/ecommerce/integrations
 */
export async function GET(request: NextRequest) {
  try {
    const t = requireTenantId(request);
    if (t instanceof NextResponse) return t;

    const supabase = createAdminServiceClient();
    const { data, error } = await supabase
      .from("ecommerce_integrations")
      .select("id, tenant_id, provider, display_name, shop_identifier, status, last_sync_at, last_error, metadata, created_at")
      .eq("tenant_id", t.tenantId)
      .order("provider");

    if (error) {
      console.error("ecommerce integrations list", error);
      return NextResponse.json({ integrations: [], sync_logs: [], warning: error.message });
    }

    const { data: logs, error: logErr } = await supabase
      .from("ecommerce_sync_logs")
      .select("id, provider, level, action, detail, created_at")
      .eq("tenant_id", t.tenantId)
      .order("created_at", { ascending: false })
      .limit(40);

    if (logErr) {
      console.warn("ecommerce_sync_logs", logErr.message);
    }

    return NextResponse.json({ integrations: data ?? [], sync_logs: logs ?? [] });
  } catch (e) {
    console.error("ecommerce integrations GET", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

type PostBody = {
  provider?: string;
  shop_identifier?: string | null;
  display_name?: string | null;
  access_token?: string | null;
  refresh_token?: string | null;
  status?: string;
};

/**
 * POST /api/dashboard/ecommerce/integrations
 * Register or update a store connection (tokens stored server-side; rotate in production via vault).
 */
export async function POST(request: NextRequest) {
  try {
    const t = requireTenantId(request);
    if (t instanceof NextResponse) return t;

    let body: PostBody;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }

    const provider = body.provider as EcommerceProvider;
    if (!PROVIDERS.includes(provider)) {
      return NextResponse.json({ error: "Invalid provider" }, { status: 400 });
    }

    const supabase = createAdminServiceClient();
    const shop = (body.shop_identifier ?? "").trim() || null;
    const display = (body.display_name ?? "").trim() || null;

    const base = supabase
      .from("ecommerce_integrations")
      .select("id")
      .eq("tenant_id", t.tenantId)
      .eq("provider", provider);
    const { data: existing, error: findErr } = shop
      ? await base.eq("shop_identifier", shop).maybeSingle()
      : await base.is("shop_identifier", null).maybeSingle();

    if (findErr) {
      console.error("ecommerce find", findErr);
      return NextResponse.json({ error: findErr.message }, { status: 500 });
    }

    const row = {
      tenant_id: t.tenantId,
      provider,
      shop_identifier: shop,
      display_name: display,
      status: body.status ?? "connected",
      access_token: body.access_token ?? null,
      refresh_token: body.refresh_token ?? null,
      metadata: {} as Record<string, unknown>,
      updated_at: new Date().toISOString(),
      last_error: null as string | null,
    };

    if (existing?.id) {
      const { error } = await supabase.from("ecommerce_integrations").update(row).eq("id", existing.id);
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      await appendSyncLog({
        tenantId: t.tenantId,
        integrationId: existing.id,
        provider,
        action: "integration_updated",
        detail: { shop },
      });
      return NextResponse.json({ ok: true, id: existing.id });
    }

    const { data: inserted, error } = await supabase
      .from("ecommerce_integrations")
      .insert(row)
      .select("id")
      .maybeSingle();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    const id = (inserted as { id?: string } | null)?.id;
    await appendSyncLog({
      tenantId: t.tenantId,
      integrationId: id ?? null,
      provider,
      action: "integration_created",
      detail: { shop },
    });
    return NextResponse.json({ ok: true, id });
  } catch (e) {
    console.error("ecommerce integrations POST", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
