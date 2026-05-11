import { NextRequest, NextResponse } from "next/server";
import { requireTenantId } from "@/lib/tenants/context";
import { createAdminServiceClient } from "@/lib/supabase/admin-service";

export async function GET(request: NextRequest) {
  try {
    const t = requireTenantId(request);
    if (t instanceof NextResponse) return t;
    const supabase = createAdminServiceClient();
    const { data, error } = await supabase
      .from("hazmat_audit_log")
      .select("*")
      .eq("tenant_id", t.tenantId)
      .order("created_at", { ascending: false })
      .limit(500);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ audit: data ?? [] });
  } catch (e) {
    console.error("hazmat audit", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
