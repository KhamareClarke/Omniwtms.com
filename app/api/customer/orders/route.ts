import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  "https://qpkaklmbiwitlroykjim.supabase.co";
const serviceRoleKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFwa2FrbG1iaXdpdGxyb3lramltIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczNjgxMzg2MiwiZXhwIjoyMDUyMzg5ODYyfQ.IBTdBXb3hjobEUDeMGRNbRKZoavL0Bvgpyoxb1HHr34";

/**
 * GET /api/customer/orders?customer_id=xxx
 * Returns orders for the given customer (organization-associated) with status.
 * Uses service role so customer can see orders linked to them.
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

    const supabase = createClient(supabaseUrl, serviceRoleKey);

    let orders: any[] = [];

    // Main orders table (optional – may not exist or have different schema)
    try {
      const { data: ordersData, error: ordersError } = await supabase
        .from("orders")
        .select(
          "id, order_number, status, created_at, updated_at, order_items(id, quantity, skus(name, code))"
        )
        .eq("customer_id", customerId)
        .order("created_at", { ascending: false });

      if (!ordersError && ordersData && Array.isArray(ordersData)) {
        orders = ordersData.map((o: any) => ({
          id: o.id,
          order_number: o.order_number,
          status: o.status || "pending",
          created_at: o.created_at,
          updated_at: o.updated_at,
          items: (o.order_items || []).map((i: any) => ({
            id: i.id,
            quantity: i.quantity,
            sku_name: i.skus?.name,
            sku_code: i.skus?.code,
          })),
        }));
      }
    } catch (e) {
      console.warn("Customer orders: main orders query skipped", e);
    }

    // simple_orders: what "Create Order" uses – always try so customer sees their orders
    let simpleOrders: any[] = [];
    try {
      const { data: simpleData, error: simpleError } = await supabase
        .from("simple_orders")
        .select("id, description, quantity, created_at")
        .eq("customer_id", customerId)
        .order("created_at", { ascending: false });

      if (simpleError) {
        console.warn("Customer orders: simple_orders query failed", simpleError);
      } else if (simpleData && Array.isArray(simpleData)) {
        simpleOrders = simpleData.map((row: any) => ({
          id: row.id,
          order_number: `SO-${String(row.id || "").slice(0, 8)}`,
          status: "active",
          created_at: row.created_at,
          updated_at: row.created_at,
          items: [
            {
              quantity: row.quantity,
              sku_name: row.description ?? "Item",
              sku_code: null,
            },
          ],
        }));
      }
    } catch (e) {
      console.warn("Customer orders: simple_orders query skipped", e);
    }

    // Deliveries assigned to this customer by the organization (courier + products) – show as orders in portal
    let deliveryOrders: any[] = [];
    try {
      const { data: deliveriesData, error: delError } = await supabase
        .from("deliveries")
        .select("id, package_id, status, created_at, updated_at, products")
        .eq("customer_id", customerId)
        .order("created_at", { ascending: false });

      if (!delError && deliveriesData && Array.isArray(deliveriesData)) {
        deliveryOrders = deliveriesData.map((d: any) => {
          const products = d.products || [];
          const items = Array.isArray(products)
            ? products.map((p: any) => ({
                quantity: p.quantity ?? 1,
                sku_name: p.name ?? p.sku ?? "Product",
                sku_code: p.sku ?? null,
              }))
            : [];
          return {
            id: d.id,
            order_number: d.package_id || d.id?.slice(0, 8) || "—",
            status:
              d.status === "completed"
                ? "delivered"
                : d.status === "in_progress" || d.status === "out_for_delivery"
                ? "processing"
                : d.status === "failed"
                ? "cancelled"
                : "pending",
            created_at: d.created_at,
            updated_at: d.updated_at,
            items: items.length ? items : [{ quantity: 1, sku_name: "Delivery assigned", sku_code: null }],
            _source: "delivery",
          };
        });
      }
    } catch (e) {
      console.warn("Customer orders: deliveries query skipped", e);
    }

    const merged = [...deliveryOrders, ...orders, ...simpleOrders].sort(
      (a, b) =>
        new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()
    );

    return NextResponse.json({ orders: merged });
  } catch (err) {
    console.error("Customer orders API error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to fetch orders" },
      { status: 500 }
    );
  }
}
