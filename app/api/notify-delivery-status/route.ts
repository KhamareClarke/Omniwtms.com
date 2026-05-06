import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { sendEmail, brandedEmailHtml } from "@/lib/email";
import { emitStatusUpdated } from "@/lib/events";
import "@/services/listeners/delivery";

function getClientIp(request: NextRequest): string | null {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    null
  );
}

const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  "https://qpkaklmbiwitlroykjim.supabase.co";
const serviceRoleKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFwa2FrbG1iaXdpdGxyb3lramltIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczNjgxMzg2MiwiZXhwIjoyMDUyMzg5ODYyfQ.IBTdBXb3hjobEUDeMGRNbRKZoavL0Bvgpyoxb1HHr34";

/**
 * POST /api/notify-delivery-status
 * Body: { delivery_id: string, new_status: string, notify_organization?: boolean, triggered_by?: "organization" | "courier" }
 * Customer receives email ONLY when triggered_by === "organization".
 * When courier updates: audit/timeline + email to organization and admin (no customer). Org can then update status to notify customer.
 * When organization updates: customer email + admin; org email only if sendToOrg.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { delivery_id: deliveryId, new_status: newStatus, notify_organization: notifyOrg, triggered_by: triggeredBy, pod_file: podFileFromBody } = body;
    const sendToOrg = notifyOrg !== false;
    if (!deliveryId || !newStatus) {
      return NextResponse.json(
        { error: "delivery_id and new_status are required" },
        { status: 400 }
      );
    }
    const emailConfigured =
      (process.env.EMAIL_USER != null && process.env.EMAIL_PASS != null) ||
      (process.env.RESEND_API_KEY != null && process.env.RESEND_API_KEY.trim() !== "");
    const adminEmail = (process.env.ADMIN_EMAIL || "clarkekhamare@gmail.com").trim();
    const statusLabel =
      newStatus === "completed"
        ? "Completed"
        : newStatus === "failed"
        ? "Failed"
        : newStatus === "out_for_delivery"
        ? "Out for delivery"
        : "In progress";

    const supabase = createClient(supabaseUrl, serviceRoleKey);
    const { data: delivery, error } = await supabase
      .from("deliveries")
      .select(
        `
        id,
        package_id,
        status,
        pod_file,
        shipping_label,
        client_id,
        customer_id,
        clients!client_id ( email ),
        customers!customer_id ( email, name )
      `
      )
      .eq("id", deliveryId)
      .single();

    if (error || !delivery) {
      console.error("Notify delivery status: fetch error", error);
      return NextResponse.json(
        { error: error?.message ?? "Delivery not found" },
        { status: 404 }
      );
    }

    const packageId = delivery.package_id ?? deliveryId;
    const previousStatus = (delivery as any).status;
    const podFile = (delivery as any).pod_file || podFileFromBody;

    // Internal event architecture: emit for listeners (email, audit, notifications, future stock/webhooks)
    emitStatusUpdated({
      delivery_id: deliveryId,
      package_id: packageId,
      old_status: previousStatus,
      new_status: newStatus,
      triggered_by: triggeredBy === "organization" ? "organization" : "courier",
      pod_file: podFile || undefined,
      metadata: { package_id: packageId },
    });

    const clientIp = getClientIp(request);
    const auditMeta = (extra: Record<string, unknown> = {}) => ({
      package_id: packageId,
      ...(clientIp ? { ip: clientIp } : {}),
      ...extra,
    });

    // Always write audit + timeline (even when email not configured)
    try {
      await supabase.from("delivery_audit_log").insert({
        delivery_id: deliveryId,
        action: "status_updated",
        actor_type: triggeredBy === "organization" ? "organization" : "courier",
        old_value: previousStatus,
        new_value: newStatus,
        metadata: auditMeta(podFile && newStatus === "completed" ? { pod_file: podFile } : {}),
      });
    } catch (e) {
      console.warn("Audit log insert skipped:", e);
    }
    if (newStatus === "completed" && podFile) {
      try {
        await supabase.from("delivery_audit_log").insert({
          delivery_id: deliveryId,
          action: "pod_uploaded",
          actor_type: triggeredBy === "organization" ? "organization" : "courier",
          new_value: podFile,
          metadata: auditMeta(),
        });
      } catch (e) {
        console.warn("Audit pod_uploaded insert skipped:", e);
      }
    }
    try {
      const step = newStatus === "completed" ? "delivered" : newStatus === "out_for_delivery" ? "out_for_delivery" : newStatus === "in_progress" ? "at_facility" : newStatus === "pending" ? "order_processed" : newStatus;
      await supabase.from("delivery_timeline").insert({
        delivery_id: deliveryId,
        step,
        metadata: { status: newStatus },
      });
    } catch (e) {
      console.warn("Timeline insert skipped:", e);
    }

    const fromTo =
      delivery.shipping_label?.from && delivery.shipping_label?.to
        ? `From: ${delivery.shipping_label.from}<br/>To: ${delivery.shipping_label.to}`
        : "";
    const podLinkHtml = podFile
      ? `<p><strong>Proof of delivery:</strong> <a href="${podFile}" target="_blank" rel="noopener">View POD</a></p>`
      : "";

    const baseContent = `
      <p><strong>Delivery status update</strong></p>
      <p><strong>Package ID:</strong> ${packageId}</p>
      <p><strong>New status:</strong> ${statusLabel}</p>
      ${fromTo ? `<p>${fromTo}</p>` : ""}
      ${podLinkHtml}
      <p>Check your dashboard for full details.</p>
    `;

    let emailed = false;
    if (emailConfigured) {
      const orgEmail =
        (delivery.clients as { email?: string } | null)?.email?.trim?.() || "";

      // Organization when org triggered (status update from dashboard)
      if (sendToOrg && orgEmail && triggeredBy === "organization") {
        try {
          await sendEmail({
            to: orgEmail,
            subject: `Delivery ${statusLabel}: ${packageId}`,
            html: brandedEmailHtml(`<p>Delivery status has been updated.</p>${baseContent}`, `Delivery ${statusLabel}`),
          });
          emailed = true;
        } catch (e) {
          console.error("Notify org email failed:", e);
        }
      }

      // Organization when courier performed action: so org knows and can update status → then customer gets notified
      if (orgEmail && triggeredBy === "courier") {
        try {
          const courierActionContent = `
            <p><strong>Courier activity</strong></p>
            <p>Your courier has reported a delivery update. Only you can confirm the order status; when you update the status in the dashboard, the customer will be notified.</p>
            ${baseContent}
            <p><strong>Action:</strong> Update this delivery’s status in the dashboard if you want to notify the customer.</p>
          `;
          await sendEmail({
            to: orgEmail,
            subject: `[OmniWTMS] Courier activity – ${statusLabel}: ${packageId}`,
            html: brandedEmailHtml(courierActionContent, "Courier Activity"),
          });
          emailed = true;
        } catch (e) {
          console.error("Notify org (courier activity) email failed:", e);
        }
      }

      const customerRow = delivery.customers as { email?: string; name?: string } | null;
      const customerEmail = customerRow?.email?.trim?.() || "";
      if (customerEmail && triggeredBy === "organization") {
        try {
          const name = customerRow?.name ? ` ${customerRow.name}` : "";
          const customerContent = `<p>Hello${name},</p><p>Your parcel delivery status has been updated.</p>${baseContent}
<p><strong>Your tracking number:</strong> <code style="background:#f0f0f0;padding:2px 6px;border-radius:4px;">${packageId}</code></p>
<p>Track your delivery anytime at <strong>Track</strong> (no login required) or in the customer dashboard.</p>`;
          await sendEmail({
            to: customerEmail,
            subject: newStatus === "completed" ? `Your delivery has been delivered – ${packageId}` : `Your delivery is ${statusLabel.toLowerCase()} – ${packageId}`,
            html: brandedEmailHtml(customerContent, "Delivery Update"),
          });
          emailed = true;
        } catch (e) {
          console.error("Notify customer email failed:", e);
        }
      }

      if (adminEmail) {
        try {
          const adminNote =
            triggeredBy === "organization"
              ? "Customer and organization have been notified where applicable."
              : "Organization has been notified of courier activity. Customer is notified only when organization updates status.";
          await sendEmail({
            to: adminEmail,
            subject: `[OmniWTMS] Delivery ${statusLabel}: ${packageId}`,
            html: brandedEmailHtml(
              `${baseContent}<p><strong>Triggered by:</strong> ${triggeredBy === "organization" ? "Organization" : "Courier"}</p><p>${adminNote}</p>`,
              "Admin: Delivery Update"
            ),
          });
          emailed = true;
        } catch (e) {
          console.error("Notify admin email failed:", e);
        }
        try {
          await supabase.from("delivery_audit_log").insert({
            delivery_id: deliveryId,
            action: "email_sent",
            actor_type: "system",
            new_value: "admin",
            metadata: auditMeta({ to: adminEmail, subject: `Delivery ${statusLabel}: ${packageId}` }),
          });
        } catch (_) {}
      }
    }

    return NextResponse.json({ ok: true, emailed: emailConfigured && emailed, audit_and_timeline: true });
  } catch (err) {
    console.error("Notify delivery status error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to notify" },
      { status: 500 }
    );
  }
}
