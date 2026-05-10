import { getGhlCredentialsForTenant } from "@/lib/ghl/credentials";
import { sendSMSViaGHL } from "@/lib/ghl/send-sms";
import { logNotification } from "@/lib/notifications/log";

/**
 * Send SMS via Go High Level (uses shared GHL client in /lib/ghl).
 */
export async function sendSMS(options: {
  tenantId: string;
  to: string;
  body: string;
}): Promise<{ ok: boolean; error?: string; messageId?: string }> {
  const auth = await getGhlCredentialsForTenant(options.tenantId);
  if (!auth) {
    const msg = "Go High Level is not configured (ghl_location_id / ghl_api_key or GHL_* env).";
    await logNotification({
      tenantId: options.tenantId,
      channel: "sms",
      recipient: options.to,
      status: "skipped",
      errorMessage: msg,
      metadata: {},
    });
    return { ok: false, error: msg };
  }

  const phone = options.to.replace(/\s+/g, "");
  try {
    const r = await sendSMSViaGHL(auth, phone, options.body);
    if (!r.ok) {
      await logNotification({
        tenantId: options.tenantId,
        channel: "sms",
        recipient: phone,
        status: "failed",
        errorMessage: r.error,
        metadata: { provider: "ghl" },
      });
      return { ok: false, error: r.error };
    }
    await logNotification({
      tenantId: options.tenantId,
      channel: "sms",
      recipient: phone,
      status: "sent",
      providerMessageId: r.messageId ?? null,
      metadata: { provider: "ghl" },
    });
    return { ok: true, messageId: r.messageId };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    await logNotification({
      tenantId: options.tenantId,
      channel: "sms",
      recipient: phone,
      status: "failed",
      errorMessage: msg,
      metadata: { provider: "ghl" },
    });
    return { ok: false, error: msg };
  }
}
