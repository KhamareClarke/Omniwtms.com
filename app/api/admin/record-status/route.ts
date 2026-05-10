import { NextResponse } from "next/server";
import { createAdminServiceClient } from "@/lib/supabase/admin-service";
import { getVerifiedAdminFromRequest } from "@/lib/auth/require-admin-api";

const TABLES = ["clients", "couriers", "customers"] as const;
type AdminTable = (typeof TABLES)[number];

/**
 * PATCH /api/admin/record-status
 * Body: { table: "clients" | "couriers" | "customers", id: string, status: "active" | "inactive" }
 */
export async function PATCH(req: Request) {
  const admin = await getVerifiedAdminFromRequest();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { table?: string; id?: string; status?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const table = body.table as AdminTable;
  const id = typeof body.id === "string" ? body.id : "";
  const status = body.status;
  if (!TABLES.includes(table as AdminTable)) {
    return NextResponse.json({ error: "Invalid table" }, { status: 400 });
  }
  if (!id) {
    return NextResponse.json({ error: "id required" }, { status: 400 });
  }
  if (status !== "active" && status !== "inactive") {
    return NextResponse.json({ error: "status must be active or inactive" }, { status: 400 });
  }

  const supabase = createAdminServiceClient();
  const { error } = await supabase.from(table).update({ status }).eq("id", id);
  if (error) {
    console.error("admin record-status:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
