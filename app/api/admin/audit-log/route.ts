import { NextRequest, NextResponse } from "next/server";
import { createAdminServiceClient } from "@/lib/supabase/admin-service";
import { getVerifiedAdminFromRequest } from "@/lib/auth/require-admin-api";

/**
 * GET /api/admin/audit-log?limit=100
 * Requires admin session cookie.
 */
export async function GET(request: NextRequest) {
  const admin = await getVerifiedAdminFromRequest();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const limit = Math.min(Number(request.nextUrl.searchParams.get("limit")) || 100, 500);
    const supabase = createAdminServiceClient();

    const { data, error } = await supabase
      .from("delivery_audit_log")
      .select(`
        id,
        delivery_id,
        action,
        actor_type,
        actor_id,
        old_value,
        new_value,
        metadata,
        created_at,
        deliveries!delivery_id ( package_id )
      `)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) {
      console.error("Audit log fetch error:", error);
      const msg = error.message || "";
      if (msg.includes("does not exist") || msg.includes("relation") || msg.includes("42P01")) {
        return NextResponse.json({ list: [], migration_suggested: true });
      }
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const list = (data || []).map((row: any) => {
      const d = row.deliveries;
      const pkg = Array.isArray(d) ? d[0] : d;
      return {
        id: row.id,
        delivery_id: row.delivery_id,
        package_id: pkg?.package_id ?? row.metadata?.package_id ?? String(row.delivery_id || "").slice(0, 8),
        action: row.action,
        actor_type: row.actor_type,
        old_value: row.old_value,
        new_value: row.new_value,
        metadata: row.metadata,
        created_at: row.created_at,
      };
    });

    return NextResponse.json({ list });
  } catch (err) {
    console.error("Admin audit-log API error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to fetch audit log" },
      { status: 500 }
    );
  }
}
