import { NextResponse } from "next/server";
import {
  createLoginChallenge,
  findAdminByEmail,
  isAccountLocked,
  recordFailedLoginAttempt,
  sendAdminLoginOtpEmail,
  upgradeLegacyPasswordIfNeeded,
  verifyAdminPassword,
} from "@/lib/auth/admin";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    const password = typeof body.password === "string" ? body.password : "";
    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required." }, { status: 400 });
    }

    const admin = await findAdminByEmail(email);
    if (!admin) {
      return NextResponse.json({ error: "Incorrect email or password." }, { status: 401 });
    }
    if (admin.status === "inactive") {
      return NextResponse.json({ error: "This account is inactive. Contact support." }, { status: 403 });
    }
    if (isAccountLocked(admin)) {
      return NextResponse.json(
        {
          error:
            "This account is locked after too many failed attempts. Try again later or contact support.",
        },
        { status: 423 }
      );
    }

    const ok = await verifyAdminPassword(admin, password);
    if (!ok) {
      await recordFailedLoginAttempt(admin.id, admin.failed_login_attempts ?? 0);
      return NextResponse.json({ error: "Incorrect email or password." }, { status: 401 });
    }

    await upgradeLegacyPasswordIfNeeded(admin.id, password, admin);

    const { id: challengeId, plainCode } = await createLoginChallenge(admin.id);
    await sendAdminLoginOtpEmail({
      code: plainCode,
      adminEmail: admin.email,
      adminName: admin.name,
    });

    return NextResponse.json({
      ok: true,
      challengeId,
      message: "A verification code was sent to the administrator inboxes.",
    });
  } catch (e) {
    console.error("verify-password", e);
    const msg = e instanceof Error ? e.message : "Error";
    if (msg.includes("ADMIN_OTP") || msg.includes("EMAIL_USER") || msg.includes("EMAIL_PASS")) {
      return NextResponse.json(
        { error: "Email is not configured on the server. Set ADMIN_OTP_RECIPIENTS, EMAIL_USER, and EMAIL_PASS (SMTP)." },
        { status: 500 }
      );
    }
    return NextResponse.json({ error: "Something went wrong. Try again." }, { status: 500 });
  }
}
