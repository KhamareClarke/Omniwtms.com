import { NextRequest, NextResponse } from "next/server";
import { sendEmail } from "@/lib/email";

/**
 * POST /api/send-email
 * Body: { to: string | string[], subject: string, html: string, text?: string }
 * Sends email via SMTP. Requires EMAIL_USER and EMAIL_PASS in env (e.g. Gmail app password).
 */
export async function POST(request: NextRequest) {
  try {
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      console.error("EMAIL_USER or EMAIL_PASS not set");
      return NextResponse.json(
        { error: "Email not configured. Set EMAIL_USER and EMAIL_PASS in .env.local" },
        { status: 503 }
      );
    }

    const body = await request.json();
    const { to, subject, html, text } = body;

    if (!to || !subject || !html) {
      return NextResponse.json(
        { error: "to, subject, and html are required" },
        { status: 400 }
      );
    }

    await sendEmail({ to, subject, html, text });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Send email error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to send email" },
      { status: 500 }
    );
  }
}
