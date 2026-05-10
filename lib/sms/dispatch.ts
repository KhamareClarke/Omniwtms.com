import { sendSMS } from "@/lib/sms/send";
import { isSmsEnabledForTenant } from "@/lib/notifications/preferences";

/**
 * Sends an SMS via Go High Level when the tenant allows SMS and a phone is present.
 */
export async function maybeSendTenantSms(options: {
  tenantId: string;
  to: string | null | undefined;
  body: string;
}): Promise<{ ok: boolean; skipped?: string; error?: string }> {
  const raw = options.to?.replace(/\s+/g, "").trim();
  if (!raw) return { ok: true, skipped: "no_phone" };
  if (!(await isSmsEnabledForTenant(options.tenantId))) {
    return { ok: true, skipped: "sms_disabled" };
  }
  const text = options.body.length > 480 ? `${options.body.slice(0, 477)}...` : options.body;
  return sendSMS({ tenantId: options.tenantId, to: raw, body: text });
}
