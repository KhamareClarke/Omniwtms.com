import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  findAdminByEmail,
  recordSuccessfulLogin,
  resetFailedLoginAttempts,
  verifyLoginChallengeAndConsume,
} from "@/lib/auth/admin";
import {
  ADMIN_SESSION_COOKIE,
  ADMIN_SESSION_MAX_AGE_SEC,
  signAdminSession,
} from "@/lib/auth/admin-session";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    const challengeId = typeof body.challengeId === "string" ? body.challengeId : "";
    const code = typeof body.code === "string" ? body.code.trim() : "";
    if (!email || !challengeId || !code) {
      return NextResponse.json({ error: "Email, challenge id, and code are required." }, { status: 400 });
    }

    const admin = await findAdminByEmail(email);
    if (!admin) {
      return NextResponse.json({ error: "Session expired. Start again from email." }, { status: 401 });
    }

    const valid = await verifyLoginChallengeAndConsume(challengeId, code, admin.id);
    if (!valid) {
      return NextResponse.json({ error: "Invalid or expired code." }, { status: 401 });
    }

    await resetFailedLoginAttempts(admin.id);
    await recordSuccessfulLogin(admin.id);

    const token = await signAdminSession(
      { sub: admin.id, email: admin.email, typ: "admin" },
      ADMIN_SESSION_MAX_AGE_SEC
    );

    const cookieStore = await cookies();
    cookieStore.set(ADMIN_SESSION_COOKIE, token, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: ADMIN_SESSION_MAX_AGE_SEC,
    });

    return NextResponse.json({
      ok: true,
      admin: { id: admin.id, email: admin.email, name: admin.name },
    });
  } catch (e) {
    console.error("verify-otp", e);
    return NextResponse.json({ error: "Something went wrong. Try again." }, { status: 500 });
  }
}
