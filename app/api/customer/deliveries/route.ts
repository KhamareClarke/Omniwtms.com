import { NextRequest, NextResponse } from "next/server";
import { createAdminServiceClient } from "@/lib/supabase/admin-service";
import { requireTenantId } from "@/lib/tenants/context";
import { assertActorBelongsToTenant } from "@/lib/tenants/validate-actor";

/**
 * GET /api/customer/deliveries?customer_id=xxx
 * Returns deliveries for the given customer_id. Uses service role so RLS does not block.
 */
export async function GET(request: NextRequest) {
  try {
    const t = requireTenantId(request);
    if (t instanceof NextResponse) return t;

    const customerId = request.nextUrl.searchParams.get("customer_id");
    if (!customerId) {
      return NextResponse.json(
        { error: "customer_id is required" },
        { status: 400 }
      );
    }

    const supabase = createAdminServiceClient();
    const ok = await assertActorBelongsToTenant(supabase, "customer", customerId, t.tenantId);
    if (!ok) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { data, error } = await supabase
      .from("deliveries")
      .select(
        `
        id,
        package_id,
        status,
        priority,
        created_at,
        notes,
        shipping_label,
        couriers!courier_id ( name, phone )
      `
      )
      .eq("customer_id", customerId)
      .eq("tenant_id", t.tenantId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching customer deliveries:", error);
      const msg = error.message || "";
      if (
        msg.includes("customer_id") ||
        msg.includes("column") ||
        msg.includes("schema cache")
      ) {
        return NextResponse.json({ deliveries: [], setupRequired: true });
      }
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ deliveries: data || [] });
  } catch (err) {
    console.error("Customer deliveries API error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to fetch deliveries" },
      { status: 500 }
    );
  }
}
