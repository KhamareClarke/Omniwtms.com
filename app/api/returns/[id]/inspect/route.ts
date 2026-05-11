import { NextRequest, NextResponse } from "next/server";
import { requireTenantId } from "@/lib/tenants/context";
import { inspectItems, type InspectLine } from "@/lib/returns/process";

type Ctx = { params: Promise<{ id: string }> };

export async function POST(request: NextRequest, ctx: Ctx) {
  try {
    const t = requireTenantId(request);
    if (t instanceof NextResponse) return t;
    const { id } = await ctx.params;
    let body: { lines?: InspectLine[] };
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }
    const lines = body.lines ?? [];
    if (!lines.length) return NextResponse.json({ error: "lines required" }, { status: 400 });
    const res = await inspectItems(t.tenantId, id, lines);
    if (!res.ok) return NextResponse.json({ error: res.error }, { status: 400 });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("returns inspect", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
