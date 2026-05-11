import { NextRequest, NextResponse } from "next/server";
import { requireTenantId } from "@/lib/tenants/context";
import { autoCreatePOsForLowStock } from "@/lib/suppliers/create-po";

export async function POST(request: NextRequest) {
  try {
    const t = requireTenantId(request);
    if (t instanceof NextResponse) return t;
    const result = await autoCreatePOsForLowStock(t.tenantId);
    return NextResponse.json(result);
  } catch (e) {
    console.error("auto-reorder", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
