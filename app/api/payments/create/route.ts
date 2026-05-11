import { NextRequest, NextResponse } from "next/server";
import { sendTemplateEmail } from "@/lib/email/send";
import { resolveTenantIdOrDefault } from "@/lib/tenants/context";
import { isEmailOutgoingConfigured } from "@/lib/email/config";
import { maybeSendTenantSms } from "@/lib/sms/dispatch";
import { empireOsDispatch, EmpireOSEvents } from "@/lib/integrations/empire-os-dispatch";

/**
 * POST /api/payments/create
 * Body: { to, customerName?, customerPhone?, amount, currency?, status: "success"|"failed", failureReason?, retryUrl?, tenant_id? }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const to = String(body.to || "").trim();
    const status = String(body.status || "success").toLowerCase();
    if (!to || body.amount == null) {
      return NextResponse.json({ error: "to and amount required" }, { status: 400 });
    }
    const tenantId =
      typeof body.tenant_id === "string" && body.tenant_id.trim() ? body.tenant_id.trim() : resolveTenantIdOrDefault(request);
    if (!(await isEmailOutgoingConfigured(tenantId))) {
      return NextResponse.json({ error: "Email not configured" }, { status: 503 });
    }
    const templateId = status === "failed" ? "payment-failed" : "payment-received";
    const base = process.env.NEXT_PUBLIC_APP_URL?.trim() || "http://localhost:3000";
    const r = await sendTemplateEmail({
      to,
      templateId,
      variables: {
        customerName: String(body.customerName || "Customer"),
        amount: String(body.amount),
        currency: String(body.currency || "GBP"),
        failureReason: String(body.failureReason || "Payment declined"),
        retryUrl: String(body.retryUrl || base),
      },
      tenantId,
    });
    if (!r.ok) return NextResponse.json({ error: r.error }, { status: 500 });
    if (status === "success") {
      empireOsDispatch(tenantId, EmpireOSEvents.PERFORMANCE_MILESTONE, {
        kind: "payment_received",
        amount: String(body.amount),
        currency: String(body.currency || "GBP"),
        customer: String(body.customerName || "Customer"),
      });
    }
    const phone = String(body.customerPhone || "").trim();
    if (phone) {
      const line =
        status === "failed"
          ? `Payment failed: ${String(body.amount)} ${String(body.currency || "GBP")}. ${String(body.failureReason || "")}`
          : `Payment received: ${String(body.amount)} ${String(body.currency || "GBP")}. Thank you.`;
      await maybeSendTenantSms({ tenantId, to: phone, body: line.slice(0, 480) });
    }
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Bad request" }, { status: 400 });
  }
}
