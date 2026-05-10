import { NextRequest, NextResponse } from "next/server";
import { createAdminServiceClient } from "@/lib/supabase/admin-service";
import { DEFAULT_TENANT_ID } from "@/lib/tenants/constants";
import { buildInvoicePdfLines } from "@/lib/billing/invoices";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, context: Ctx) {
  const { id } = await context.params;
  const clientId = request.nextUrl.searchParams.get("client_id")?.trim();
  if (!clientId) return NextResponse.json({ error: "client_id required" }, { status: 400 });

  const supabase = createAdminServiceClient();
  const { data: client } = await supabase.from("clients").select("tenant_id").eq("id", clientId).maybeSingle();
  const tenantId = (client as { tenant_id?: string | null } | null)?.tenant_id?.trim() || DEFAULT_TENANT_ID;

  const { data: inv, error: iErr } = await supabase.from("tenant_billing_invoices").select("*").eq("id", id).maybeSingle();
  if (iErr || !inv) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const row = inv as { tenant_id: string; line_items: unknown };
  if (row.tenant_id !== tenantId) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { data: ten } = await supabase.from("tenants").select("name").eq("id", tenantId).maybeSingle();
  const tenantName = String((ten as { name?: string } | null)?.name || "Organization");

  const items = Array.isArray(row.line_items)
    ? (row.line_items as Array<{ label: string; amount_gbp: number }>)
    : [];

  const pdf = buildInvoicePdfLines({
    id: (inv as { id: string }).id,
    period_start: String((inv as { period_start: string }).period_start),
    period_end: String((inv as { period_end: string }).period_end),
    tenantName,
    base_amount_gbp: Number((inv as { base_amount_gbp: unknown }).base_amount_gbp) || 0,
    overage_amount_gbp: Number((inv as { overage_amount_gbp: unknown }).overage_amount_gbp) || 0,
    total_amount_gbp: Number((inv as { total_amount_gbp: unknown }).total_amount_gbp) || 0,
    line_items: items.length
      ? items
      : [
          { label: "Base subscription", amount_gbp: Number((inv as { base_amount_gbp: unknown }).base_amount_gbp) || 0 },
          { label: "Overages", amount_gbp: Number((inv as { overage_amount_gbp: unknown }).overage_amount_gbp) || 0 },
        ],
  });

  return new NextResponse(pdf, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="invoice-${id}.pdf"`,
    },
  });
}
