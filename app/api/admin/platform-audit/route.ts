import { NextRequest, NextResponse } from "next/server";
import { createAdminServiceClient } from "@/lib/supabase/admin-service";
import { getVerifiedAdminFromRequest } from "@/lib/auth/require-admin-api";

/**
 * GET /api/admin/platform-audit?action=&admin_email=&tenant_id=&from=&to=&search=&limit=
 */
export async function GET(request: NextRequest) {
  const admin = await getVerifiedAdminFromRequest();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const sp = request.nextUrl.searchParams;
  const limit = Math.min(Number(sp.get("limit")) || 200, 1000);
  const action = sp.get("action")?.trim();
  const adminEmail = sp.get("admin_email")?.trim().toLowerCase();
  const tenantId = sp.get("tenant_id")?.trim();
  const from = sp.get("from");
  const to = sp.get("to");
  const search = sp.get("search")?.trim().toLowerCase();

  const supabase = createAdminServiceClient();
  let q = supabase
    .from("platform_admin_audit_log")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (action) q = q.eq("action", action);
  if (adminEmail) q = q.ilike("admin_email", `%${adminEmail}%`);
  if (tenantId) q = q.eq("tenant_id", tenantId);
  if (from) q = q.gte("created_at", from);
  if (to) q = q.lte("created_at", to);

  const { data, error } = await q;
  if (error) {
    if (error.message?.includes("does not exist") || error.code === "42P01") {
      return NextResponse.json({ rows: [], migration_required: true });
    }
    console.error("platform-audit:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  let rows = data || [];
  if (search) {
    rows = rows.filter(
      (r) =>
        String(r.action || "")
          .toLowerCase()
          .includes(search) ||
        String(r.admin_name || "")
          .toLowerCase()
          .includes(search) ||
        String(r.tenant_name || "")
          .toLowerCase()
          .includes(search) ||
        String(r.resource_type || "")
          .toLowerCase()
          .includes(search)
    );
  }

  return NextResponse.json({ rows });
}
