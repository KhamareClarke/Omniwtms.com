import { NextRequest, NextResponse } from "next/server";
import { requireTenantId } from "@/lib/tenants/context";
import { issueRefund } from "@/lib/returns/process";

type Ctx = { params: Promise<{ id: string }> };

export async function POST(request: NextRequest, ctx: Ctx) {
  try {
    const t = requireTenantId(request);
    if (t instanceof NextResponse) return t;
    const { id } = await ctx.params;
    let reference = "";
    try {
      const b = await request.json();
      reference = String(b?.reference ?? "");
    } catch {
      /* */
    }
    if (!reference.trim()) return NextResponse.json({ error: "reference required" }, { status: 400 });
    const res = await issueRefund(t.tenantId, id, reference);
    if (!res.ok) return NextResponse.json({ error: res.error }, { status: 400 });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("returns refund", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
