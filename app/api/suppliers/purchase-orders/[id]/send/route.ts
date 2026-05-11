import { NextRequest, NextResponse } from "next/server";
import { requireTenantId } from "@/lib/tenants/context";
import { sendPOToSupplier } from "@/lib/suppliers/create-po";

type Ctx = { params: Promise<{ id: string }> };

export async function POST(request: NextRequest, ctx: Ctx) {
  try {
    const t = requireTenantId(request);
    if (t instanceof NextResponse) return t;
    const { id } = await ctx.params;
    const res = await sendPOToSupplier({ tenantId: t.tenantId, poId: id });
    if (!res.ok) return NextResponse.json({ error: res.error }, { status: 400 });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("PO send", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
