import { NextResponse } from "next/server";
import { findAdminByEmail, isAccountLocked } from "@/lib/auth/admin";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    if (!email || !email.includes("@")) {
      return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 });
    }
    const admin = await findAdminByEmail(email);
    if (!admin) {
      return NextResponse.json({ error: "No admin account found for that email." }, { status: 404 });
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
    return NextResponse.json({ ok: true, email: admin.email });
  } catch (e) {
    console.error("check-email", e);
    return NextResponse.json({ error: "Something went wrong. Try again." }, { status: 500 });
  }
}
