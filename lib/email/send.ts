import { sendEmail, loadMailBranding, brandedEmailHtml } from "@/lib/email";
import { isEmailOutgoingConfigured, useGhlEmail } from "@/lib/email/config";
import { buildEmailFromTemplate, isTemplateId, type TemplateId } from "@/lib/email/templates";
import { logNotification } from "@/lib/notifications/log";
import { isEmailEnabledForTenant } from "@/lib/notifications/preferences";

export type { TemplateId } from "@/lib/email/templates";

/**
 * Send a transactional email from a template id + variables (SMTP + tenant branding wrapper).
 */
export async function sendTemplateEmail(options: {
  to: string;
  templateId: string;
  variables?: Record<string, string>;
  tenantId?: string | null;
  /** When true, ignores notification_preferences for this send. */
  force?: boolean;
}): Promise<{ ok: boolean; error?: string }> {
  if (!isTemplateId(options.templateId)) {
    return { ok: false, error: `Unknown template: ${options.templateId}` };
  }
  const templateId = options.templateId;
  const tenantId = options.tenantId ?? null;

  if (!(await isEmailOutgoingConfigured(tenantId))) {
    const msg = useGhlEmail()
      ? "GHL email: set tenant GHL fields or env GHL_API_KEY + GHL_LOCATION_ID (USE_GHL_EMAIL=true)."
      : "SMTP: set EMAIL_USER and EMAIL_PASS.";
    await logNotification({
      tenantId,
      channel: "email",
      recipient: options.to,
      templateId,
      status: "failed",
      subject: null,
      errorMessage: msg,
      metadata: { reason: "not_configured" },
    });
    return { ok: false, error: msg };
  }

  if (!options.force && tenantId && !(await isEmailEnabledForTenant(tenantId, templateId))) {
    await logNotification({
      tenantId,
      channel: "email",
      recipient: options.to,
      templateId,
      status: "skipped",
      subject: null,
      metadata: { reason: "preference_disabled" },
    });
    return { ok: true };
  }

  const { subject, htmlBody } = buildEmailFromTemplate(
    templateId,
    options.variables ?? {},
    tenantId
  );
  const branding = await loadMailBranding(tenantId ?? undefined);
  const fullHtml = brandedEmailHtml(htmlBody, subject, branding);
  const fromName = branding?.companyName;

  try {
    await sendEmail({
      to: options.to,
      subject,
      html: fullHtml,
      fromDisplayName: fromName,
      tenantId,
    });
    await logNotification({
      tenantId,
      channel: "email",
      recipient: options.to,
      templateId,
      status: "sent",
      subject,
      metadata: {},
    });
    return { ok: true };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    await logNotification({
      tenantId,
      channel: "email",
      recipient: options.to,
      templateId,
      status: "failed",
      subject,
      errorMessage: msg,
      metadata: {},
    });
    return { ok: false, error: msg };
  }
}
