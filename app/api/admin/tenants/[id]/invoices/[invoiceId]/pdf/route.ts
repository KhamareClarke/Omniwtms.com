import { NextRequest, NextResponse } from "next/server";
import { createAdminServiceClient } from "@/lib/supabase/admin-service";
import { getVerifiedAdminFromRequest } from "@/lib/auth/require-admin-api";
import { buildInvoicePdfLines } from "@/lib/billing/invoices";

type Ctx = { params: Promise<{ id: string; invoiceId: string }> };

export async function GET(_request: NextRequest, context: Ctx) {
  const admin = await getVerifiedAdminFromRequest();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: tenantId, invoiceId } = await context.params;
  const supabase = createAdminServiceClient();

  const { data: inv, error } = await supabase.from("tenant_billing_invoices").select("*").eq("id", invoiceId).maybeSingle();
  if (error || !inv) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if ((inv as { tenant_id: string }).tenant_id !== tenantId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const { data: ten } = await supabase.from("tenants").select("name").eq("id", tenantId).maybeSingle();
  const tenantName = String((ten as { name?: string } | null)?.name || "Organization");
  const row = inv as {
    id: string;
    period_start: string;
    period_end: string;
    base_amount_gbp: unknown;
    overage_amount_gbp: unknown;
    total_amount_gbp: unknown;
    line_items: unknown;
  };
  const items = Array.isArray(row.line_items)
    ? (row.line_items as Array<{ label: string; amount_gbp: number }>)
    : [
        { label: "Base subscription", amount_gbp: Number(row.base_amount_gbp) || 0 },
        { label: "Overages", amount_gbp: Number(row.overage_amount_gbp) || 0 },
      ];

  const pdf = buildInvoicePdfLines({
    id: row.id,
    period_start: row.period_start,
    period_end: row.period_end,
    tenantName,
    base_amount_gbp: Number(row.base_amount_gbp) || 0,
    overage_amount_gbp: Number(row.overage_amount_gbp) || 0,
    total_amount_gbp: Number(row.total_amount_gbp) || 0,
    line_items: items,
  });

  return new NextResponse(pdf, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="invoice-${invoiceId}.pdf"`,
    },
  });
}
