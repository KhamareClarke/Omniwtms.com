import { NextRequest, NextResponse } from "next/server";
import { requireTenantId } from "@/lib/tenants/context";
import { createAdminServiceClient } from "@/lib/supabase/admin-service";

/**
 * POST /api/dashboard/empire-os/recommendations
 * Body: { recommendation_id: string, action: 'accepted'|'dismissed'|'snoozed', metadata?: object }
 *
 * Records an operator action for analytics recommendations shown in the Empire OS dashboard.
 */
export async function POST(request: NextRequest) {
  try {
    const t = requireTenantId(request);
    if (t instanceof NextResponse) return t;

    const body = (await request.json()) as {
      recommendation_id?: unknown;
      action?: unknown;
      metadata?: unknown;
      actor?: unknown;
    };

    const recommendation_id = typeof body.recommendation_id === "string" ? body.recommendation_id.trim() : "";
    const action = typeof body.action === "string" ? body.action.trim() : "";
    const actor = typeof body.actor === "string" ? body.actor.trim() : undefined;
    const metadata = body.metadata && typeof body.metadata === "object" ? (body.metadata as Record<string, unknown>) : {};

    if (!recommendation_id) return NextResponse.json({ error: "recommendation_id required" }, { status: 400 });
    if (!["accepted", "dismissed", "snoozed"].includes(action)) {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    const supabase = createAdminServiceClient();
    const { data, error } = await supabase
      .from("empire_os_recommendation_actions")
      .insert({
        tenant_id: t.tenantId,
        recommendation_id,
        action,
        actor: actor ?? null,
        metadata,
      })
      .select("id, created_at")
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true, ...data }, { status: 201 });
  } catch (e) {
    console.error("empire-os recommendations POST", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

