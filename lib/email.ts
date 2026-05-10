import nodemailer from "nodemailer";
import { getTenantConfig, withDefaultBranding } from "@/lib/tenants/config";
import { useGhlEmail } from "@/lib/email/config";
import { getGhlCredentialsForTenant } from "@/lib/ghl/credentials";
import { sendEmailViaGHL } from "@/lib/ghl/send-email";

const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 1500;

/** Tenant-aware HTML email header/footer (from DB). */
export type MailBranding = {
  companyName: string;
  primaryColor: string;
  secondaryColor: string;
  logoUrl: string | null;
};

export async function loadMailBranding(tenantId: string | null | undefined): Promise<MailBranding | null> {
  if (!tenantId || typeof tenantId !== "string") return null;
  const raw = await getTenantConfig(tenantId);
  if (!raw) return null;
  const b = withDefaultBranding(raw);
  return {
    companyName: b.name,
    primaryColor: b.primary_color,
    secondaryColor: b.secondary_color,
    logoUrl: b.logo_url,
  };
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/**
 * Send email: SMTP (default) or Go High Level when USE_GHL_EMAIL=true (+ GHL keys / tenant ghl_*).
 */
export async function sendEmail(options: {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  /** Display name in the From header (SMTP only; GHL uses conversation email). */
  fromDisplayName?: string;
  /** When set, GHL credentials resolve from this tenant before env fallback. */
  tenantId?: string | null;
}): Promise<void> {
  const toList = Array.isArray(options.to) ? options.to : [options.to];

  if (useGhlEmail()) {
    const auth = await getGhlCredentialsForTenant(options.tenantId ?? null);
    if (!auth) {
      throw new Error("GHL email: missing API key or location id (tenant or env).");
    }
    for (const addr of toList) {
      const r = await sendEmailViaGHL(auth, addr.trim(), options.subject, options.html, options.text);
      if (!r.ok) throw new Error(r.error);
    }
    return;
  }

  const user = process.env.EMAIL_USER?.trim();
  const pass = process.env.EMAIL_PASS?.replace(/\s+/g, "");

  if (!user || !pass) {
    throw new Error("EMAIL_USER and EMAIL_PASS must be set for SMTP (all outbound mail uses this transport).");
  }

  const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 587,
    secure: false,
    auth: { user, pass },
  });
  const display = options.fromDisplayName?.trim() || "OmniWTMS";
  const mailOptions = {
    from: `"${display.replace(/"/g, "'")}" <${user}>`,
    to: toList.join(", "),
    subject: options.subject,
    text: options.text ?? options.html.replace(/<[^>]*>/g, ""),
    html: options.html,
  };

  let lastError: Error | null = null;
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      await transporter.sendMail(mailOptions);
      return;
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
      if (attempt < MAX_RETRIES) {
        await new Promise((r) => setTimeout(r, RETRY_DELAY_MS));
      }
    }
  }
  throw lastError ?? new Error("Send email failed");
}

/**
 * Branded HTML wrapper for transactional emails. Pass `branding` for tenant white-label.
 */
export function brandedEmailHtml(content: string, title?: string, branding?: MailBranding | null): string {
  const company = escapeHtml(branding?.companyName ?? "OmniWTMS");
  const primary = branding?.primaryColor ?? "#3456FF";
  const secondary = branding?.secondaryColor ?? "#5C4EFF";
  const pageTitle = escapeHtml(title ?? branding?.companyName ?? "OmniWTMS");
  const logoBlock =
    branding?.logoUrl != null && branding.logoUrl.length > 0
      ? `<img src="${encodeURI(branding.logoUrl)}" alt="" style="max-height:44px;margin-bottom:10px;display:block;" />`
      : "";

  const tagline =
    branding?.companyName && branding.companyName !== "OmniWTMS"
      ? `<p style="margin:4px 0 0;opacity:0.9;font-size:14px;">Warehouse &amp; transport updates</p>`
      : `<p style="margin:4px 0 0;opacity:0.9;font-size:14px;">Warehouse &amp; Transport Management</p>`;

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${pageTitle}</title>
</head>
<body style="margin:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#f3f4f6;padding:24px;">
  <div style="max-width:560px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.08);">
    <div style="background:linear-gradient(90deg, ${escapeHtml(primary)}, ${escapeHtml(secondary)});color:#fff;padding:20px 24px;">
      ${logoBlock}
      <strong style="font-size:18px;">${company}</strong>
      ${tagline}
    </div>
    <div style="padding:24px;color:#374151;line-height:1.6;">
      ${content}
    </div>
    <div style="padding:16px 24px;background:#f9fafb;font-size:12px;color:#6b7280;">
      This is an automated message from ${company}. Please do not reply to this email.
    </div>
  </div>
</body>
</html>`;
}
