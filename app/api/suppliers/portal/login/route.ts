import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcrypt";
import { createAdminServiceClient } from "@/lib/supabase/admin-service";
import { requireTenantId } from "@/lib/tenants/context";

export async function POST(request: NextRequest) {
  try {
    const t = requireTenantId(request);
    if (t instanceof NextResponse) return t;
    const body = (await request.json()) as { email?: string; password?: string };
    const email = body.email?.trim().toLowerCase();
    const password = body.password ?? "";
    if (!email || !password) return NextResponse.json({ error: "email and password required" }, { status: 400 });

    const supabase = createAdminServiceClient();
    const { data, error } = await supabase
      .from("supplier_portal_users")
      .select("id, supplier_id, password_hash")
      .eq("tenant_id", t.tenantId)
      .eq("email", email)
      .maybeSingle();
    if (error || !data) return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    const row = data as { id: string; supplier_id: string; password_hash: string };
    const ok = await bcrypt.compare(password, row.password_hash);
    if (!ok) return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });

    await supabase
      .from("supplier_portal_users")
      .update({ last_login_at: new Date().toISOString() })
      .eq("id", row.id);
    return NextResponse.json({ ok: true, supplier_id: row.supplier_id });
  } catch (e) {
    console.error("supplier portal login", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
