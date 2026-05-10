export { sendTemplateEmail, type TemplateId } from "@/lib/email/send";
export { sendSMS } from "@/lib/sms/send";
export { maybeSendTenantSms } from "@/lib/sms/dispatch";
export { logNotification } from "@/lib/notifications/log";
export {
  getNotificationPreferences,
  upsertNotificationPreferences,
  isEmailEnabledForTenant,
  type EmailPref,
} from "@/lib/notifications/preferences";

/**
 * Push notifications (Web Push / FCM) — stub: logs only until keys are configured.
 */
export async function sendPushNotification(input: {
  tenantId: string;
  userId?: string | null;
  title: string;
  body: string;
  data?: Record<string, string>;
}): Promise<{ ok: boolean }> {
  await logNotification({
    tenantId: input.tenantId,
    channel: "push",
    recipient: input.userId ?? "broadcast",
    subject: input.title,
    status: "skipped",
    metadata: { body: input.body, data: input.data ?? {}, reason: "push_not_configured" },
  });
  return { ok: true };
}
