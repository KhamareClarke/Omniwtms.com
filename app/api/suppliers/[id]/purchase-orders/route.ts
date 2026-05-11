import { NextRequest, NextResponse } from "next/server";
import { requireTenantId } from "@/lib/tenants/context";
import { createAdminServiceClient } from "@/lib/supabase/admin-service";
import { createPO } from "@/lib/suppliers/create-po";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, ctx: Ctx) {
  try {
    const t = requireTenantId(request);
    if (t instanceof NextResponse) return t;
    const { id } = await ctx.params;
    const supabase = createAdminServiceClient();
    const { data, error } = await supabase
      .from("purchase_orders")
      .select("*, po_items(*)")
      .eq("tenant_id", t.tenantId)
      .eq("supplier_id", id)
      .order("order_date", { ascending: false });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ purchase_orders: data ?? [] });
  } catch (e) {
    console.error("supplier POs GET", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest, ctx: Ctx) {
  try {
    const t = requireTenantId(request);
    if (t instanceof NextResponse) return t;
    const { id } = await ctx.params;
    const body = (await request.json()) as {
      delivery_date?: string | null;
      notes?: string | null;
      items?: { sku_id: string; quantity: number; unit_price: number }[];
    };
    const result = await createPO({
      tenantId: t.tenantId,
      supplierId: id,
      deliveryDate: body.delivery_date ?? null,
      notes: body.notes ?? null,
      items: body.items ?? [],
    });
    if (!result.ok) return NextResponse.json({ error: result.error }, { status: 400 });
    return NextResponse.json(result, { status: 201 });
  } catch (e) {
    console.error("supplier POs POST", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
