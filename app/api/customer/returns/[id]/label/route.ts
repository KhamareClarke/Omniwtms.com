import { NextRequest, NextResponse } from "next/server";
import { requireTenantId } from "@/lib/tenants/context";
import { createAdminServiceClient } from "@/lib/supabase/admin-service";
import { assertActorBelongsToTenant } from "@/lib/tenants/validate-actor";
import { generateReturnLabelPdf } from "@/lib/returns/approve";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, ctx: Ctx) {
  try {
    const t = requireTenantId(request);
    if (t instanceof NextResponse) return t;
    const customerId = request.nextUrl.searchParams.get("customer_id")?.trim();
    if (!customerId) return NextResponse.json({ error: "customer_id required" }, { status: 400 });
    const supabase = createAdminServiceClient();
    const ok = await assertActorBelongsToTenant(supabase, "customer", customerId, t.tenantId);
    if (!ok) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const { id } = await ctx.params;
    const { data, error } = await supabase
      .from("returns")
      .select("rma_number, customer_id")
      .eq("id", id)
      .eq("tenant_id", t.tenantId)
      .eq("customer_id", customerId)
      .maybeSingle();
    if (error || !data) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const base = data as { rma_number: string; customer_id: string };
    const { data: cust } = await supabase.from("customers").select("name, address").eq("id", base.customer_id).maybeSingle();
    const c = cust as { name?: string; address?: string } | null;
    const pdf = generateReturnLabelPdf({
      rma_number: base.rma_number,
      customerName: c?.name ?? "Customer",
      address: c?.address ?? undefined,
    });
    return new NextResponse(new Uint8Array(pdf), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="return-label-${base.rma_number}.pdf"`,
      },
    });
  } catch (e) {
    console.error("customer returns label", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
