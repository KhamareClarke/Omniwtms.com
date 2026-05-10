import { NextRequest, NextResponse } from "next/server";
import { createAdminServiceClient } from "@/lib/supabase/admin-service";
import { requireTenantId } from "@/lib/tenants/context";

export async function POST(request: NextRequest) {
  const t = requireTenantId(request);
  if (t instanceof NextResponse) return t;
  try {
    const { sku_id, bin_id, quantity } = await request.json();

    if (!sku_id || !bin_id || quantity === undefined) {
      return NextResponse.json(
        { error: "SKU ID, Bin ID, and Quantity are required." },
        { status: 400 }
      );
    }

    const supabase = createAdminServiceClient();
    const { data, error } = await supabase
      .from("pallets")
      .insert({ sku_id, bin_id, quantity, tenant_id: t.tenantId })
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
