import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createAdminServiceClient } from "@/lib/supabase/admin-service";
import { TENANT_ID_COOKIE, DEFAULT_TENANT_ID } from "@/lib/tenants/constants";
import { isValidTenantId } from "@/lib/tenants/context";

/**
 * GET /api/auth/tenant-info — org label for dashboard header (cookie-based).
 */
export async function GET() {
  try {
    const cookieStore = await cookies();
    const raw = cookieStore.get(TENANT_ID_COOKIE)?.value?.trim();
    const tenantId = isValidTenantId(raw) ? raw : DEFAULT_TENANT_ID;

    const supabase = createAdminServiceClient();

    const { data: client } = await supabase
      .from("clients")
      .select("company")
      .eq("tenant_id", tenantId)
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle();

    const { data: tenant } = await supabase.from("tenants").select("name").eq("id", tenantId).maybeSingle();

    const organizationName =
      (client as { company?: string } | null)?.company ||
      (tenant as { name?: string } | null)?.name ||
      "Organization";

    return NextResponse.json({
      tenant_id: tenantId,
      organization_name: organizationName,
    });
  } catch (e) {
    console.error("tenant-info", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
