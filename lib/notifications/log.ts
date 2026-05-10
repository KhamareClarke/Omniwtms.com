import { createAdminServiceClient } from "@/lib/supabase/admin-service";

export type NotificationChannel = "email" | "sms" | "push";

export type LogNotificationInput = {
  tenantId?: string | null;
  channel: NotificationChannel;
  recipient: string;
  subject?: string | null;
  templateId?: string | null;
  status: "sent" | "failed" | "skipped" | "queued";
  providerMessageId?: string | null;
  errorMessage?: string | null;
  metadata?: Record<string, unknown>;
};

/**
 * Best-effort insert into notification_logs (ignores if table missing in dev).
 */
export async function logNotification(input: LogNotificationInput): Promise<void> {
  try {
    const supabase = createAdminServiceClient();
    const { error } = await supabase.from("notification_logs").insert({
      tenant_id: input.tenantId ?? null,
      channel: input.channel,
      recipient: input.recipient,
      subject: input.subject ?? null,
      template_id: input.templateId ?? null,
      status: input.status,
      provider_message_id: input.providerMessageId ?? null,
      error_message: input.errorMessage ?? null,
      metadata: input.metadata ?? {},
    });
    if (error && !String(error.message).includes("does not exist")) {
      console.warn("notification_logs insert:", error.message);
    }
  } catch (e) {
    console.warn("notification_logs skipped:", e);
  }
}
