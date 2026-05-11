import { NextRequest, NextResponse } from "next/server";
import { requireTenantId } from "@/lib/tenants/context";
import { createAdminServiceClient } from "@/lib/supabase/admin-service";

export async function GET(_request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const t = requireTenantId(_request);
    if (t instanceof NextResponse) return t;
    const { id } = await context.params;
    const supabase = createAdminServiceClient();
    const { data, error } = await supabase
      .from("returns")
      .select("*, return_items(*)")
      .eq("id", id)
      .eq("tenant_id", t.tenantId)
      .maybeSingle();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    if (!data) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(data);
  } catch (e) {
    console.error("returns/[id] GET", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
