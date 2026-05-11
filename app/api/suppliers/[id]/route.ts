import { NextRequest, NextResponse } from "next/server";
import { requireTenantId } from "@/lib/tenants/context";
import { createAdminServiceClient } from "@/lib/supabase/admin-service";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, ctx: Ctx) {
  try {
    const t = requireTenantId(request);
    if (t instanceof NextResponse) return t;
    const { id } = await ctx.params;
    const supabase = createAdminServiceClient();

    const { data: supplier, error } = await supabase
      .from("suppliers")
      .select("*")
      .eq("id", id)
      .eq("tenant_id", t.tenantId)
      .maybeSingle();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    if (!supplier) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const { data: pos } = await supabase
      .from("purchase_orders")
      .select(
        "id, po_number, status, order_date, delivery_date, total_amount, notes, po_items(id, quantity, unit_price, total, skus(name, code))"
      )
      .eq("tenant_id", t.tenantId)
      .eq("supplier_id", id)
      .order("order_date", { ascending: false })
      .limit(500);

    const rows = (pos ?? []) as { status?: string; order_date?: string | null; delivery_date?: string | null }[];
    const delivered = rows.filter((r) => r.status === "delivered");
    const onTime = delivered.filter((r) => {
      if (!r.delivery_date || !r.order_date) return false;
      return new Date(r.delivery_date).getTime() <= new Date(r.order_date).getTime() + 1000 * 60 * 60 * 24 * 14;
    }).length;
    const onTimePct = delivered.length ? Math.round((onTime / delivered.length) * 1000) / 10 : 0;

    return NextResponse.json({
      supplier,
      purchase_orders: pos ?? [],
      metrics: {
        total_pos: rows.length,
        delivered: delivered.length,
        on_time_pct: onTimePct,
      },
    });
  } catch (e) {
    console.error("suppliers/[id] GET", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, ctx: Ctx) {
  try {
    const t = requireTenantId(request);
    if (t instanceof NextResponse) return t;
    const { id } = await ctx.params;
    const body = (await request.json()) as Record<string, unknown>;
    const supabase = createAdminServiceClient();
    const { data, error } = await supabase
      .from("suppliers")
      .update({ ...body, updated_at: new Date().toISOString() })
      .eq("id", id)
      .eq("tenant_id", t.tenantId)
      .select("*")
      .single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data);
  } catch (e) {
    console.error("suppliers/[id] PATCH", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
