import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { sendEmail, brandedEmailHtml, loadMailBranding } from "@/lib/email";
import { sendTemplateEmail } from "@/lib/email/send";
import { maybeSendTenantSms } from "@/lib/sms/dispatch";
import { isEmailOutgoingConfigured } from "@/lib/email/config";
import { emitDeliveryAssigned } from "@/lib/events";

const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  "https://qpkaklmbiwitlroykjim.supabase.co";
const serviceRoleKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFwa2FrbG1iaXdpdGxyb3lramltIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczNjgxMzg2MiwiZXhwIjoyMDUyMzg5ODYyfQ.IBTdBXb3hjobEUDeMGRNbRKZoavL0Bvgpyoxb1HHr34";

/**
 * POST /api/notify-delivery-assigned
 * Called when organization assigns a delivery. Sends email to admin and logs.
 */
export async function POST(request: NextRequest) {
  try {
    const adminEmail = (process.env.ADMIN_EMAIL || "clarkekhamare@gmail.com").trim();

    const body = await request.json();
    const { delivery_id: deliveryId, package_id: packageId, pickup, delivery_to, courier_name } = body;
    if (!deliveryId || !packageId) {
      return NextResponse.json({ error: "delivery_id and package_id required" }, { status: 400 });
    }

    // Internal event architecture: emit for listeners
    emitDeliveryAssigned({
      delivery_id: deliveryId,
      package_id: packageId,
      courier_name,
      pickup,
      delivery_to,
    });

    const clientIp =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      request.headers.get("x-real-ip") ||
      null;
    const metadata: Record<string, unknown> = { package_id: packageId };
    if (clientIp) metadata.ip = clientIp;

    const supabase = createClient(supabaseUrl, serviceRoleKey);
    const { data: delRow } = await supabase
      .from("deliveries")
      .select("tenant_id, courier_id")
      .eq("id", deliveryId)
      .maybeSingle();
    const tenantId = (delRow as { tenant_id?: string | null } | null)?.tenant_id ?? null;
    const emailOk = await isEmailOutgoingConfigured(tenantId);
    const courierId = (delRow as { courier_id?: string | null } | null)?.courier_id ?? null;
    type CourierRow = { name?: string | null; email?: string | null; phone?: string | null };
    let courier: CourierRow | null = null;
    if (courierId) {
      const { data: c } = await supabase
        .from("couriers")
        .select("name, email, phone")
        .eq("id", courierId)
        .maybeSingle();
      courier = (c as CourierRow | null) ?? null;
    }
    const mailBranding = await loadMailBranding(tenantId);
    const fromName = mailBranding?.companyName;

    if (emailOk && adminEmail) {
      try {
        await sendEmail({
          to: adminEmail,
          subject: `[${fromName ?? "OmniWTMS"}] New delivery assigned: ${packageId}`,
          html: brandedEmailHtml(
            `<p><strong>New delivery assigned</strong> (admin notification)</p>
<p><strong>Package ID:</strong> ${packageId}</p>
<p><strong>Pickup:</strong> ${pickup || "—"}</p>
<p><strong>Delivery to:</strong> ${delivery_to || "—"}</p>
<p><strong>Courier:</strong> ${courier_name || "—"}</p>
<p>Check the dashboard for full details.</p>`,
            "New Delivery Assigned",
            mailBranding
          ),
          fromDisplayName: fromName,
          tenantId,
        });
      } catch (e) {
        console.error("Admin assign email failed:", e);
      }
    }

    if (emailOk && courier?.email?.trim()) {
      await sendTemplateEmail({
        to: courier.email.trim(),
        templateId: "delivery-assigned",
        variables: {
          courierName: courier.name || courier_name || "Courier",
          packageId,
          pickupAddress: String(pickup || "—"),
          dropoffAddress: String(delivery_to || "—"),
        },
        tenantId,
      });
    }
    if (tenantId && courier?.phone?.trim()) {
      await maybeSendTenantSms({
        tenantId: tenantId as string,
        to: courier.phone.trim(),
        body: `New delivery ${packageId}. Pickup: ${String(pickup || "")}. Check your courier app.`,
      });
    }
    try {
      await supabase.from("delivery_audit_log").insert({
        delivery_id: deliveryId,
        action: "delivery_assigned",
        actor_type: "organization",
        new_value: packageId,
        metadata,
      });
    } catch (_) {}
    try {
      await supabase.from("delivery_timeline").insert({
        delivery_id: deliveryId,
        step: "order_processed",
        metadata: { event: "assigned" },
      });
    } catch (_) {}

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Notify delivery assigned error:", err);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
