import { NextRequest, NextResponse } from "next/server";
import { requireTenantId } from "@/lib/tenants/context";
import { createAdminServiceClient } from "@/lib/supabase/admin-service";
import { sendTemplateEmail } from "@/lib/email/send";

type Ctx = { params: Promise<{ id: string }> };

export async function POST(request: NextRequest, ctx: Ctx) {
  try {
    const t = requireTenantId(request);
    if (t instanceof NextResponse) return t;
    const { id } = await ctx.params;
    const body = (await request.json()) as {
      status?: "in_transit" | "delivered";
      delivery_date?: string | null;
      invoice_reference?: string | null;
    };
    const status = body.status ?? "in_transit";
    const supabase = createAdminServiceClient();
    const { data: po, error } = await supabase
      .from("purchase_orders")
      .select("id, po_number, supplier_id, suppliers(contact_email, name)")
      .eq("id", id)
      .eq("tenant_id", t.tenantId)
      .maybeSingle();
    if (error || !po) return NextResponse.json({ error: "PO not found" }, { status: 404 });

    const { error: updErr } = await supabase
      .from("purchase_orders")
      .update({
        status,
        delivery_date: body.delivery_date ?? null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .eq("tenant_id", t.tenantId);
    if (updErr) return NextResponse.json({ error: updErr.message }, { status: 500 });

    const row = po as { po_number: string; suppliers?: { contact_email?: string | null; name?: string | null } | null };
    const supplierEmail = row.suppliers?.contact_email?.trim();
    if (status === "delivered" && supplierEmail) {
      await sendTemplateEmail({
        to: supplierEmail,
        tenantId: t.tenantId,
        templateId: "receipt-confirmation",
        variables: {
          customerName: row.suppliers?.name ?? "Supplier",
          poNumber: row.po_number,
        },
        force: true,
      });
      await sendTemplateEmail({
        to: supplierEmail,
        tenantId: t.tenantId,
        templateId: "supplier-invoice-generated",
        variables: {
          customerName: row.suppliers?.name ?? "Supplier",
          poNumber: row.po_number,
          invoiceReference: body.invoice_reference ?? `INV-${row.po_number}`,
        },
        force: true,
      });
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("PO delivery update", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
