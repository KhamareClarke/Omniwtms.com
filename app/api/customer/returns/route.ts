import { NextRequest, NextResponse } from "next/server";
import { requireTenantId } from "@/lib/tenants/context";
import { createAdminServiceClient } from "@/lib/supabase/admin-service";
import { assertActorBelongsToTenant } from "@/lib/tenants/validate-actor";
import { createReturn } from "@/lib/returns/create";

/**
 * GET /api/customer/returns?customer_id=uuid
 */
export async function GET(request: NextRequest) {
  try {
    const t = requireTenantId(request);
    if (t instanceof NextResponse) return t;
    const customerId = request.nextUrl.searchParams.get("customer_id")?.trim();
    if (!customerId) {
      return NextResponse.json({ error: "customer_id required" }, { status: 400 });
    }
    const supabase = createAdminServiceClient();
    const ok = await assertActorBelongsToTenant(supabase, "customer", customerId, t.tenantId);
    if (!ok) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const { data, error } = await supabase
      .from("returns")
      .select("*, return_items(*)")
      .eq("tenant_id", t.tenantId)
      .eq("customer_id", customerId)
      .order("created_at", { ascending: false });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ returns: data ?? [] });
  } catch (e) {
    console.error("customer/returns GET", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

/**
 * POST /api/customer/returns
 * Body: { customer_id, order_id?, simple_order_id?, reason, items: [{ sku_id, quantity, condition }] }
 */
export async function POST(request: NextRequest) {
  try {
    const t = requireTenantId(request);
    if (t instanceof NextResponse) return t;
    let body: {
      customer_id?: string;
      order_id?: string | null;
      simple_order_id?: string | null;
      reason?: string;
      items?: { sku_id: string; quantity: number; condition: string }[];
    };
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }
    if (!body.customer_id) return NextResponse.json({ error: "customer_id required" }, { status: 400 });
    const supabase = createAdminServiceClient();
    const ok = await assertActorBelongsToTenant(supabase, "customer", body.customer_id, t.tenantId);
    if (!ok) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const res = await createReturn({
      tenantId: t.tenantId,
      customerId: body.customer_id,
      orderId: body.order_id ?? null,
      simpleOrderId: body.simple_order_id ?? null,
      reason: body.reason ?? "",
      items: (body.items ?? []).map((i) => ({
        sku_id: i.sku_id,
        quantity: i.quantity,
        condition: (i.condition as "unopened" | "opened" | "damaged" | "unknown") ?? "unknown",
      })),
    });
    if (!res.ok) return NextResponse.json({ error: res.error }, { status: 400 });
    return NextResponse.json(res);
  } catch (e) {
    console.error("customer/returns POST", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
