import { NextRequest, NextResponse } from "next/server";
import { createAdminServiceClient } from "@/lib/supabase/admin-service";
import { requireTenantId } from "@/lib/tenants/context";

export async function POST(request: NextRequest) {
  const t = requireTenantId(request);
  if (t instanceof NextResponse) return t;
  try {
    const { sku_id, reason, quantity, location } = await request.json();

    if (!sku_id || !reason || !location || quantity === undefined) {
      return NextResponse.json(
        { error: "SKU ID, Reason, Quantity, and Location are required." },
        { status: 400 }
      );
    }

    const supabase = createAdminServiceClient();
    const { data, error } = await supabase
      .from("quarantine")
      .insert({ sku_id, reason, quantity, location, tenant_id: t.tenantId })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Server Error" }, { status: 500 });
  }
}
