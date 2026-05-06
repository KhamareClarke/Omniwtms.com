import nodemailer from "nodemailer";
import { Resend } from "resend";

const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 1500;

/**
 * Send email via Resend (if RESEND_API_KEY set) or SMTP (EMAIL_USER, EMAIL_PASS).
 * Retries up to MAX_RETRIES on failure. Used by /api/send-email and /api/notify-delivery-status.
 */
export async function sendEmail(options: {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
}): Promise<void> {
  const toList = Array.isArray(options.to) ? options.to : [options.to];
  const resendKey = process.env.RESEND_API_KEY?.trim();

  if (resendKey) {
    const resend = new Resend(resendKey);
    const from = process.env.RESEND_FROM || process.env.EMAIL_USER || "OmniWTMS <onboarding@resend.dev>";
    let lastError: Error | null = null;
    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      try {
        const { error } = await resend.emails.send({
          from,
          to: toList,
          subject: options.subject,
          html: options.html,
        });
        if (error) throw new Error(error.message);
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

  const user = process.env.EMAIL_USER;
  const pass = process.env.EMAIL_PASS;
  if (!user || !pass) {
    throw new Error("EMAIL_USER and EMAIL_PASS required when RESEND_API_KEY is not set");
  }
  const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 587,
    secure: false,
    auth: { user, pass },
  });
  const mailOptions = {
    from: `"OmniWTMS" <${user}>`,
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
 * Branded HTML wrapper for shipment emails. Use for Shipment Created, In Transit, Delivered.
 */
export function brandedEmailHtml(content: string, title?: string): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title ?? "OmniWTMS"}</title>
</head>
<body style="margin:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#f3f4f6;padding:24px;">
  <div style="max-width:560px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.08);">
    <div style="background:#3456FF;color:#fff;padding:20px 24px;">
      <strong style="font-size:18px;">OmniWTMS</strong>
      <p style="margin:4px 0 0;opacity:0.9;font-size:14px;">Warehouse & Transport Management</p>
    </div>
    <div style="padding:24px;color:#374151;line-height:1.6;">
      ${content}
    </div>
    <div style="padding:16px 24px;background:#f9fafb;font-size:12px;color:#6b7280;">
      This is an automated message from OmniWTMS. Please do not reply to this email.
    </div>
  </div>
</body>
</html>`;
}
