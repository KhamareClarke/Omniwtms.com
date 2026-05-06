import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

/**
 * GET /api/customer/deliveries?customer_id=xxx
 * Returns deliveries for the given customer_id. Uses service role so RLS does not block.
 * Customer portal calls this so "My Deliveries" shows assigned deliveries.
 */
export async function GET(request: NextRequest) {
  try {
    const customerId = request.nextUrl.searchParams.get("customer_id");
    if (!customerId) {
      return NextResponse.json(
        { error: "customer_id is required" },
        { status: 400 }
      );
    }

    const supabaseUrl =
      process.env.NEXT_PUBLIC_SUPABASE_URL ||
      "https://qpkaklmbiwitlroykjim.supabase.co";
    const serviceRoleKey =
      process.env.SUPABASE_SERVICE_ROLE_KEY ||
      "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFwa2FrbG1iaXdpdGxyb3lramltIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczNjgxMzg2MiwiZXhwIjoyMDUyMzg5ODYyfQ.IBTdBXb3hjobEUDeMGRNbRKZoavL0Bvgpyoxb1HHr34";

    const supabase = createClient(supabaseUrl, serviceRoleKey);

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
