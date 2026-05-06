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
 * GET /api/public/track?tracking_number=xxx
 * Public tracking: no auth. Returns only status, timeline, POD, package_id, from/to.
 * Server-side validation of tracking number (package_id).
 */
export async function GET(request: NextRequest) {
  try {
    const trackingNumber = request.nextUrl.searchParams.get("tracking_number")?.trim();
    if (!trackingNumber) {
      return NextResponse.json(
        { error: "tracking_number is required" },
        { status: 400 }
      );
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const { data: delivery, error } = await supabase
      .from("deliveries")
      .select("id, package_id, status, pod_file, created_at, updated_at, notes, shipping_label")
      .eq("package_id", trackingNumber)
      .maybeSingle();

    if (error) {
      console.error("Public track fetch error:", error);
      return NextResponse.json(
        { error: "Failed to look up tracking" },
        { status: 500 }
      );
    }

    if (!delivery) {
      return NextResponse.json(
        { error: "No shipment found for this tracking number." },
        { status: 404 }
      );
    }

    const { data: timelineRows } = await supabase
      .from("delivery_timeline")
      .select("id, step, occurred_at, metadata")
      .eq("delivery_id", delivery.id)
      .order("occurred_at", { ascending: true });

    const timeline = (timelineRows || []).map((r: { step: string; occurred_at: string; metadata?: unknown }) => ({
      step: r.step,
      occurred_at: r.occurred_at,
      label: stepToLabel(r.step),
      metadata: r.metadata,
    }));

    return NextResponse.json({
      delivery: {
        package_id: delivery.package_id,
        status: delivery.status,
        pod_file: delivery.pod_file,
        created_at: delivery.created_at,
        updated_at: delivery.updated_at,
        notes: delivery.status === "failed" ? delivery.notes : undefined,
        from: delivery.shipping_label?.from,
        to: delivery.shipping_label?.to,
      },
      timeline,
    });
  } catch (err) {
    console.error("Public track API error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to look up tracking" },
      { status: 500 }
    );
  }
}
