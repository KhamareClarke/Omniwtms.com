import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createAdminServiceClient } from "@/lib/supabase/admin-service";
import { ADMIN_SESSION_COOKIE, verifyAdminSessionToken } from "@/lib/auth/admin-session";

export async function GET() {
  try {
    const cookieStore = await cookies();
    const raw = cookieStore.get(ADMIN_SESSION_COOKIE)?.value;
    if (!raw) {
      return NextResponse.json({ authenticated: false }, { status: 401 });
    }
    const payload = await verifyAdminSessionToken(raw);
    if (!payload) {
      return NextResponse.json({ authenticated: false }, { status: 401 });
    }
    const supabase = createAdminServiceClient();
    const { data, error } = await supabase
      .from("admins")
      .select("id, email, name, status")
      .eq("id", payload.sub)
      .maybeSingle();
    if (error || !data || data.status === "inactive") {
      cookieStore.delete(ADMIN_SESSION_COOKIE);
      return NextResponse.json({ authenticated: false }, { status: 401 });
    }
    return NextResponse.json({
      authenticated: true,
      admin: { id: data.id, email: data.email, name: data.name },
    });
  } catch (e) {
    console.error("admin session", e);
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }
}

export async function DELETE() {
  const cookieStore = await cookies();
  cookieStore.delete(ADMIN_SESSION_COOKIE);
  return NextResponse.json({ ok: true });
}
