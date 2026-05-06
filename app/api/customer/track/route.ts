import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  "https://qpkaklmbiwitlroykjim.supabase.co";
const serviceRoleKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFwa2FrbG1iaXdpdGxyb3lramltIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczNjgxMzg2MiwiZXhwIjoyMDUyMzg5ODYyfQ.IBTdBXb3hjobEUDeMGRNbRKZoavL0Bvgpyoxb1HHr34";

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
    const customerId = request.nextUrl.searchParams.get("customer_id");
    const trackingNumber = request.nextUrl.searchParams.get("tracking_number")?.trim();
    if (!customerId || !trackingNumber) {
      return NextResponse.json(
        { error: "customer_id and tracking_number are required" },
        { status: 400 }
      );
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey);

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
