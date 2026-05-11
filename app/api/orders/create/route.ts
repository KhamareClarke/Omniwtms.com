import { NextRequest, NextResponse } from "next/server";
import { sendTemplateEmail } from "@/lib/email/send";
import { resolveTenantIdOrDefault } from "@/lib/tenants/context";
import { isEmailOutgoingConfigured } from "@/lib/email/config";
import { maybeSendTenantSms } from "@/lib/sms/dispatch";
import { empireOsDispatch, EmpireOSEvents } from "@/lib/integrations/empire-os-dispatch";

/**
 * POST /api/orders/create
 * Body: { customerEmail, customerName?, customerPhone?, orderId, amount?, currency?, tenant_id? }
 * Sends order-confirmation (extend later with real order persistence).
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const customerEmail = String(body.customerEmail || "").trim();
    if (!customerEmail || !body.orderId) {
      return NextResponse.json({ error: "customerEmail and orderId required" }, { status: 400 });
    }
    const tenantId = typeof body.tenant_id === "string" && body.tenant_id.trim() ? body.tenant_id.trim() : resolveTenantIdOrDefault(request);
    if (!(await isEmailOutgoingConfigured(tenantId))) {
      return NextResponse.json({ error: "Email not configured" }, { status: 503 });
    }
    const r = await sendTemplateEmail({
      to: customerEmail,
      templateId: "order-confirmation",
      variables: {
        customerName: String(body.customerName || "Customer"),
        orderId: String(body.orderId),
        amount: String(body.amount ?? ""),
        currency: String(body.currency || "GBP"),
      },
      tenantId,
    });
    if (!r.ok) return NextResponse.json({ error: r.error }, { status: 500 });
    empireOsDispatch(tenantId, EmpireOSEvents.ORDER_CREATED, {
      order_id: String(body.orderId),
      customer_email: customerEmail,
      amount: String(body.amount ?? ""),
      currency: String(body.currency || "GBP"),
    });
    const phone = String(body.customerPhone || "").trim();
    if (phone) {
      await maybeSendTenantSms({
        tenantId,
        to: phone,
        body: `Order ${String(body.orderId)} confirmed. Amount ${String(body.amount ?? "")} ${String(body.currency || "GBP")}. Thank you.`,
      });
    }
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: "Bad request" }, { status: 400 });
  }
}
