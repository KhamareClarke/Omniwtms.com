import { NextRequest, NextResponse } from "next/server";
import { sendTemplateEmail } from "@/lib/email/send";
import { isEmailOutgoingConfigured } from "@/lib/email/config";
import { maybeSendTenantSms } from "@/lib/sms/dispatch";

/**
 * GET/POST /api/payments/overdue-check
 * Cron: optional Authorization: Bearer CRON_SECRET
 * Body (POST) or query: to, phone?, customerName?, amount, currency?, escalationLevel (1-3), orgName?, payUrl?, tenant_id
 */
export async function GET(request: NextRequest) {
  return run(request);
}

export async function POST(request: NextRequest) {
  return run(request);
}

async function run(request: NextRequest) {
  const secret = process.env.CRON_SECRET?.trim();
  if (secret) {
    const auth = request.headers.get("authorization")?.trim();
    if (auth !== `Bearer ${secret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  try {
    const url = new URL(request.url);
    let to = url.searchParams.get("to") || "";
    let amount = url.searchParams.get("amount") || "";
    let tenantId = url.searchParams.get("tenant_id") || "";
    let escalation = url.searchParams.get("escalationLevel") || "1";
    let phone = url.searchParams.get("phone") || "";
    if (request.method === "POST") {
      const body = await request.json().catch(() => ({}));
      to = String(body.to || to).trim();
      amount = String(body.amount ?? amount);
      tenantId = String(body.tenant_id || tenantId);
      escalation = String(body.escalationLevel || escalation);
      phone = String(body.phone || phone).trim();
    }
    if (!(await isEmailOutgoingConfigured(tenantId || null))) {
      return NextResponse.json({ ok: false, skipped: "email" }, { status: 200 });
    }
    if (!to || !amount) {
      return NextResponse.json({ error: "to and amount required for manual run" }, { status: 400 });
    }
    const base = process.env.NEXT_PUBLIC_APP_URL?.trim() || "http://localhost:3000";
    await sendTemplateEmail({
      to,
      templateId: "payment-overdue",
      variables: {
        customerName: url.searchParams.get("customerName") || "Customer",
        amount,
        currency: url.searchParams.get("currency") || "GBP",
        escalationLevel: escalation,
        orgName: url.searchParams.get("orgName") || "Your organization",
        payUrl: url.searchParams.get("payUrl") || `${base}/dashboard`,
      },
      tenantId: tenantId || null,
      force: true,
    });
    if (phone && tenantId) {
      await maybeSendTenantSms({
        tenantId,
        to: phone,
        body: `Payment overdue (reminder ${escalation}): ${amount} ${url.searchParams.get("currency") || "GBP"} for ${url.searchParams.get("orgName") || "your account"}. Pay: ${url.searchParams.get("payUrl") || `${base}/dashboard`}`.slice(
          0,
          480
        ),
      });
    }
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("overdue-check", e);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
