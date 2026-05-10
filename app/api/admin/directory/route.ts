import { NextResponse } from "next/server";
import { createAdminServiceClient } from "@/lib/supabase/admin-service";
import { getVerifiedAdminFromRequest } from "@/lib/auth/require-admin-api";

/**
 * GET /api/admin/directory
 * Lists clients (organizations), couriers, and customers for the admin dashboard (service role; session required).
 */
export async function GET() {
  const admin = await getVerifiedAdminFromRequest();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createAdminServiceClient();
  const [clientsRes, couriersRes, customersRes] = await Promise.all([
    supabase.from("clients").select("id, email, company, status, created_at").order("created_at", { ascending: false }),
    supabase.from("couriers").select("id, email, name, status, created_at").order("created_at", { ascending: false }),
    supabase.from("customers").select("id, email, name, status, created_at").order("created_at", { ascending: false }),
  ]);

  const errors = [clientsRes.error, couriersRes.error, customersRes.error].filter(Boolean);
  if (errors.length) {
    console.error("admin directory:", errors);
    return NextResponse.json(
      { error: errors.map((e) => e!.message).join("; ") },
      { status: 500 }
    );
  }

  return NextResponse.json({
    clients: clientsRes.data ?? [],
    couriers: couriersRes.data ?? [],
    customers: customersRes.data ?? [],
  });
}
