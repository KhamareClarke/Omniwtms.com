import { NextRequest, NextResponse } from "next/server";
import { requireTenantId } from "@/lib/tenants/context";
import { createAdminServiceClient } from "@/lib/supabase/admin-service";

export async function GET(request: NextRequest) {
  try {
    const t = requireTenantId(request);
    if (t instanceof NextResponse) return t;
    const supabase = createAdminServiceClient();
    const { data: suppliers, error } = await supabase
      .from("suppliers")
      .select("*")
      .eq("tenant_id", t.tenantId);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    const out = [];
    for (const s of (suppliers ?? []) as { id: string; name: string; lead_time_days?: number }[]) {
      const { data: pos } = await supabase
        .from("purchase_orders")
        .select("status, order_date, delivery_date")
        .eq("tenant_id", t.tenantId)
        .eq("supplier_id", s.id);
      const rows = (pos ?? []) as { status?: string; order_date?: string; delivery_date?: string | null }[];
      const delivered = rows.filter((r) => r.status === "delivered");
      const onTime = delivered.filter((r) => {
        if (!r.delivery_date || !r.order_date) return false;
        return new Date(r.delivery_date).getTime() <= new Date(r.order_date).getTime() + (Number(s.lead_time_days ?? 7) * 86400000);
      }).length;
      out.push({
        supplier_id: s.id,
        name: s.name,
        total_po: rows.length,
        delivered: delivered.length,
        on_time_pct: delivered.length ? Math.round((onTime / delivered.length) * 1000) / 10 : 0,
        quality_rating: (s as any).quality_rating ?? null,
      });
    }
    out.sort((a, b) => (b.on_time_pct as number) - (a.on_time_pct as number));
    return NextResponse.json({ performance: out });
  } catch (e) {
    console.error("suppliers performance", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
