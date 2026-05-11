import { NextRequest, NextResponse } from "next/server";
import { requireTenantId } from "@/lib/tenants/context";
import { createAdminServiceClient } from "@/lib/supabase/admin-service";

/**
 * GET /api/returns — all returns for tenant (dashboard).
 */
export async function GET(request: NextRequest) {
  try {
    const t = requireTenantId(request);
    if (t instanceof NextResponse) return t;
    const supabase = createAdminServiceClient();
    const { data, error } = await supabase
      .from("returns")
      .select("*, return_items(*)")
      .eq("tenant_id", t.tenantId)
      .order("created_at", { ascending: false });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ returns: data ?? [] });
  } catch (e) {
    console.error("returns GET", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
