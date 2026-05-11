import { NextRequest, NextResponse } from "next/server";
import { requireTenantId } from "@/lib/tenants/context";
import { createAdminServiceClient } from "@/lib/supabase/admin-service";
import { sendTemplateEmail } from "@/lib/email/send";

export async function POST(request: NextRequest) {
  try {
    const t = requireTenantId(request);
    if (t instanceof NextResponse) return t;
    const supabase = createAdminServiceClient();
    const now = new Date();
    const soon = new Date(now.getTime() + 3 * 86400000).toISOString().slice(0, 10);
    const { data, error } = await supabase
      .from("purchase_orders")
      .select("id, po_number, delivery_date, suppliers(contact_email, name)")
      .eq("tenant_id", t.tenantId)
      .eq("status", "sent")
      .not("delivery_date", "is", null)
      .lte("delivery_date", soon);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    let reminded = 0;
    for (const po of (data ?? []) as any[]) {
      const email = po.suppliers?.contact_email?.trim();
      if (!email) continue;
      await sendTemplateEmail({
        to: email,
        tenantId: t.tenantId,
        templateId: "delivery-reminder",
        variables: {
          customerName: po.suppliers?.name ?? "Supplier",
          poNumber: po.po_number,
          deliveryDate: po.delivery_date ?? "",
        },
        force: true,
      });
      reminded += 1;
    }
    return NextResponse.json({ ok: true, reminded });
  } catch (e) {
    console.error("po reminders", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
