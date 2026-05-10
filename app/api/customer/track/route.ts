import { NextRequest, NextResponse } from "next/server";
import { createAdminServiceClient } from "@/lib/supabase/admin-service";
import { requireTenantId } from "@/lib/tenants/context";
import { assertActorBelongsToTenant } from "@/lib/tenants/validate-actor";

function stepToLabel(step: string): string {
  const map: Record<string, string> = {
    order_processed: "Order processed",
    at_facility: "Arrived at facility",
    out_for_delivery: "Out for delivery",
    delivered: "Delivered",
    collected: "Parcel collected",
  };
  return map[step] || step.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

/**
 * GET /api/customer/track?customer_id=xxx&tracking_number=yyy
 * Returns the delivery and delivery_timeline for this customer matching the tracking number (package_id).
 * Used by Track Delivery page for full tracking view.
 */
export async function GET(request: NextRequest) {
  try {
    const t = requireTenantId(request);
    if (t instanceof NextResponse) return t;

    const customerId = request.nextUrl.searchParams.get("customer_id");
    const trackingNumber = request.nextUrl.searchParams.get("tracking_number")?.trim();
    if (!customerId || !trackingNumber) {
      return NextResponse.json(
        { error: "customer_id and tracking_number are required" },
        { status: 400 }
      );
    }

    const supabase = createAdminServiceClient();
    const allowed = await assertActorBelongsToTenant(supabase, "customer", customerId, t.tenantId);
    if (!allowed) {
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
        pod_file,
        created_at,
        updated_at,
        notes,
        shipping_label,
        products,
        couriers!courier_id ( name, phone )
      `
      )
      .eq("customer_id", customerId)
      .eq("tenant_id", t.tenantId)
      .eq("package_id", trackingNumber)
      .maybeSingle();

    if (error) {
      console.error("Track fetch error:", error);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    if (!data) {
      return NextResponse.json(
        { error: "No delivery found for this tracking number. Check the number or ensure the delivery is assigned to you." },
        { status: 404 }
      );
    }

    // Fetch delivery_timeline for this delivery (order by occurred_at asc for display)
    const { data: timelineRows } = await supabase
      .from("delivery_timeline")
      .select("id, step, occurred_at, metadata")
      .eq("delivery_id", data.id)
      .order("occurred_at", { ascending: true });

    const timeline = (timelineRows || []).map((r: { step: string; occurred_at: string; metadata?: unknown }) => ({
      step: r.step,
      occurred_at: r.occurred_at,
      label: stepToLabel(r.step),
      metadata: r.metadata,
    }));

    return NextResponse.json({ delivery: data, timeline });
  } catch (err) {
    console.error("Customer track API error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to look up tracking" },
      { status: 500 }
    );
  }
}
