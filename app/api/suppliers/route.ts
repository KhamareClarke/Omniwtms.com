import { NextRequest, NextResponse } from "next/server";
import { requireTenantId } from "@/lib/tenants/context";
import { createAdminServiceClient } from "@/lib/supabase/admin-service";

export async function GET(request: NextRequest) {
  try {
    const t = requireTenantId(request);
    if (t instanceof NextResponse) return t;
    const supabase = createAdminServiceClient();
    const { data, error } = await supabase
      .from("suppliers")
      .select("*")
      .eq("tenant_id", t.tenantId)
      .order("name", { ascending: true });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ suppliers: data ?? [] });
  } catch (e) {
    console.error("suppliers GET", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const t = requireTenantId(request);
    if (t instanceof NextResponse) return t;
    const body = (await request.json()) as {
      name?: string;
      contact_email?: string | null;
      address?: string | null;
      phone?: string | null;
      lead_time_days?: number;
      min_order_qty?: number;
    };
    if (!body.name?.trim()) return NextResponse.json({ error: "name required" }, { status: 400 });
    const supabase = createAdminServiceClient();
    const { data, error } = await supabase
      .from("suppliers")
      .insert({
        tenant_id: t.tenantId,
        name: body.name.trim(),
        contact_email: body.contact_email ?? null,
        address: body.address ?? null,
        phone: body.phone ?? null,
        lead_time_days: body.lead_time_days ?? 7,
        min_order_qty: body.min_order_qty ?? 1,
      })
      .select("*")
      .single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data, { status: 201 });
  } catch (e) {
    console.error("suppliers POST", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
