import { NextRequest, NextResponse } from "next/server";
import { requireTenantId } from "@/lib/tenants/context";
import { createAdminServiceClient } from "@/lib/supabase/admin-service";

type Ctx = { params: Promise<{ id: string }> };

export async function POST(request: NextRequest, ctx: Ctx) {
  try {
    const t = requireTenantId(request);
    if (t instanceof NextResponse) return t;
    const { id } = await ctx.params;
    const supabase = createAdminServiceClient();
    const { error } = await supabase
      .from("purchase_orders")
      .update({ status: "acknowledged", updated_at: new Date().toISOString() })
      .eq("id", id)
      .eq("tenant_id", t.tenantId);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("PO acknowledge", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
