import { NextRequest, NextResponse } from "next/server";
import { sendTemplateEmail } from "@/lib/email/send";
import { maybeSendTenantSms } from "@/lib/sms/dispatch";
import { resolveTenantIdOrDefault } from "@/lib/tenants/context";
import { isEmailOutgoingConfigured } from "@/lib/email/config";

/**
 * POST /api/deliveries/create
 * Body: { customerEmail?, customerName?, packageId, trackingUrl?, courierEmail?, courierName?, courierPhone?, tenant_id? }
 * Sends order-shipped to customer (if email) and delivery-assigned to courier + optional GHL SMS.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const tenantId =
      typeof body.tenant_id === "string" && body.tenant_id.trim() ? body.tenant_id.trim() : resolveTenantIdOrDefault(request);
    const packageId = String(body.packageId || "");
    if (!packageId) {
      return NextResponse.json({ error: "packageId required" }, { status: 400 });
    }
    const trackingUrl = String(body.trackingUrl || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000");
    const customerEmail = String(body.customerEmail || "").trim();
    const courierEmail = String(body.courierEmail || "").trim();
    const courierPhone = String(body.courierPhone || "").trim();
    const emailOk = await isEmailOutgoingConfigured(tenantId);

    if (emailOk && customerEmail) {
      await sendTemplateEmail({
        to: customerEmail,
        templateId: "order-shipped",
        variables: {
          customerName: String(body.customerName || "Customer"),
          orderId: packageId,
          trackingUrl,
        },
        tenantId,
      });
    }

    if (emailOk && courierEmail) {
      await sendTemplateEmail({
        to: courierEmail,
        templateId: "delivery-assigned",
        variables: {
          courierName: String(body.courierName || "Courier"),
          packageId,
          pickupAddress: String(body.pickupAddress || "—"),
          dropoffAddress: String(body.dropoffAddress || "—"),
        },
        tenantId,
      });
    }

    if (courierPhone) {
      await maybeSendTenantSms({
        tenantId,
        to: courierPhone,
        body: `New delivery ${packageId}. Pickup: ${String(body.pickupAddress || "")}. Open your courier app.`,
      });
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: "Bad request" }, { status: 400 });
  }
}
