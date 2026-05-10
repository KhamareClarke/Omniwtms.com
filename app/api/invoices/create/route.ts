import { NextRequest, NextResponse } from "next/server";
import { sendTemplateEmail } from "@/lib/email/send";
import { resolveTenantIdOrDefault } from "@/lib/tenants/context";
import { isEmailOutgoingConfigured } from "@/lib/email/config";
import { maybeSendTenantSms } from "@/lib/sms/dispatch";

/**
 * POST /api/invoices/create
 * Body: { to, customerName?, customerPhone?, invoiceNumber, amount, currency?, invoiceUrl?, tenant_id? }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const to = String(body.to || "").trim();
    if (!to || !body.invoiceNumber) {
      return NextResponse.json({ error: "to and invoiceNumber required" }, { status: 400 });
    }
    const tenantId =
      typeof body.tenant_id === "string" && body.tenant_id.trim() ? body.tenant_id.trim() : resolveTenantIdOrDefault(request);
    if (!(await isEmailOutgoingConfigured(tenantId))) {
      return NextResponse.json({ error: "Email not configured" }, { status: 503 });
    }
    const r = await sendTemplateEmail({
      to,
      templateId: "invoice-generated",
      variables: {
        customerName: String(body.customerName || "Customer"),
        invoiceNumber: String(body.invoiceNumber),
        amount: String(body.amount ?? ""),
        currency: String(body.currency || "GBP"),
        invoiceUrl: String(body.invoiceUrl || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"),
      },
      tenantId,
    });
    if (!r.ok) return NextResponse.json({ error: r.error }, { status: 500 });
    const phone = String(body.customerPhone || "").trim();
    if (phone) {
      await maybeSendTenantSms({
        tenantId,
        to: phone,
        body: `Invoice ${String(body.invoiceNumber)}: ${String(body.amount ?? "")} ${String(body.currency || "GBP")}. View: ${String(body.invoiceUrl || process.env.NEXT_PUBLIC_APP_URL || "")}`,
      });
    }
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Bad request" }, { status: 400 });
  }
}
