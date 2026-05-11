import { NextRequest, NextResponse } from "next/server";
import { requireTenantId } from "@/lib/tenants/context";
import { createAdminServiceClient } from "@/lib/supabase/admin-service";
import { getAnalyticsBundle } from "@/lib/analytics/recommendations";
import { sendEmpireOSEvent } from "@/lib/integrations/empire-os";

function maskUrl(url: string): string {
  if (!url) return "";
  if (url.length <= 28) return `${url.slice(0, 8)}…`;
  return `${url.slice(0, 24)}…${url.slice(-8)}`;
}

/**
 * GET /api/dashboard/empire-os?warehouseId=
 * Empire OS panel: webhook status + analytics recommendations to forward.
 */
export async function GET(request: NextRequest) {
  try {
    const t = requireTenantId(request);
    if (t instanceof NextResponse) return t;
    const warehouseId = request.nextUrl.searchParams.get("warehouseId")?.trim() || null;
    const supabase = createAdminServiceClient();
    const { data: tenant, error } = await supabase
      .from("tenants")
      .select("feature_empire_os, metadata")
      .eq("id", t.tenantId)
      .maybeSingle();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    const row = tenant as { feature_empire_os?: boolean | null; metadata?: { empire_os_webhook_url?: string | null } | null } | null;
    const url = row?.metadata?.empire_os_webhook_url?.trim() ?? "";
    const bundle = await getAnalyticsBundle(t.tenantId, warehouseId);

    return NextResponse.json({
      enabled: Boolean(row?.feature_empire_os),
      webhook_configured: Boolean(url),
      webhook_preview: maskUrl(url),
      recommendations: bundle.recommendations,
      delay_risk: bundle.delay_risk,
      forecast: bundle.forecast,
      metrics: bundle.metrics,
    });
  } catch (e) {
    console.error("dashboard/empire-os GET", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

/**
 * POST /api/dashboard/empire-os
 * Body: { event?: string, payload?: object, recommendation_id?: string }
 * Sends one event payload to the tenant Empire OS webhook when enabled.
 */
export async function POST(request: NextRequest) {
  try {
    const t = requireTenantId(request);
    if (t instanceof NextResponse) return t;
    const body = (await request.json()) as {
      event?: string;
      payload?: Record<string, unknown>;
      recommendation_id?: string;
    };
    const event = typeof body.event === "string" && body.event.trim() ? body.event.trim() : "tenant.insights";
    const payload = {
      ...(body.payload && typeof body.payload === "object" ? body.payload : {}),
      recommendation_id: body.recommendation_id,
      source: "omniwtms.dashboard",
    };
    const r = await sendEmpireOSEvent({ tenantId: t.tenantId, event, payload });
    return NextResponse.json(r);
  } catch (e) {
    console.error("dashboard/empire-os POST", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
