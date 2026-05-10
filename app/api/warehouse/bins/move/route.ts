import { NextRequest, NextResponse } from "next/server";
import { createAdminServiceClient } from "@/lib/supabase/admin-service";
import { requireTenantId } from "@/lib/tenants/context";

/** POST - Move stock from one bin to another (3D to 3D). Validates capacity at destination. */
export async function POST(request: NextRequest) {
  const t = requireTenantId(request);
  if (t instanceof NextResponse) return t;

  try {
    const supabase = createAdminServiceClient();
    const body = await request.json();
    const { from_bin_id, to_bin_id, product_id, quantity } = body;

    if (!from_bin_id || !to_bin_id || !product_id || quantity == null || quantity < 1) {
      return NextResponse.json(
        { error: "from_bin_id, to_bin_id, product_id, and quantity (>=1) are required" },
        { status: 400 }
      );
    }

    if (from_bin_id === to_bin_id) {
      return NextResponse.json({ error: "Source and destination bin must be different" }, { status: 400 });
    }

    const qty = parseInt(String(quantity), 10) || 0;
    if (qty < 1) {
      return NextResponse.json({ error: "quantity must be at least 1" }, { status: 400 });
    }

    const { data: fromBin } = await supabase
      .from("warehouse_bins")
      .select("id")
      .eq("id", from_bin_id)
      .eq("tenant_id", t.tenantId)
      .maybeSingle();

    const { data: toBinRow } = await supabase
      .from("warehouse_bins")
      .select("id, max_quantity, max_volume, x, y, z")
      .eq("id", to_bin_id)
      .eq("tenant_id", t.tenantId)
      .maybeSingle();

    if (!fromBin) {
      return NextResponse.json({ error: "Source bin not found" }, { status: 404 });
    }
    if (!toBinRow) {
      return NextResponse.json({ error: "Destination bin not found" }, { status: 404 });
    }

    const { data: fromAlloc, error: fromErr } = await supabase
      .from("bin_allocations")
      .select("id, quantity")
      .eq("bin_id", from_bin_id)
      .eq("product_id", product_id)
      .eq("tenant_id", t.tenantId)
      .single();

    if (fromErr || !fromAlloc) {
      return NextResponse.json({ error: "No allocation found for this product in source bin" }, { status: 404 });
    }

    const available = fromAlloc.quantity || 0;
    if (qty > available) {
      return NextResponse.json(
        { error: `Insufficient quantity. Available: ${available}. Requested: ${qty}.` },
        { status: 400 }
      );
    }

    const toBin = toBinRow;
    const maxQty = toBin.max_quantity ?? 0;
    const { data: toAllocs } = await supabase
      .from("bin_allocations")
      .select("quantity")
      .eq("bin_id", to_bin_id)
      .eq("tenant_id", t.tenantId);

    const toCurrent = toAllocs?.reduce((s: number, a: { quantity?: number }) => s + (a.quantity || 0), 0) ?? 0;

    if (maxQty > 0 && toCurrent + qty > maxQty) {
      return NextResponse.json(
        {
          error: "Over-allocation prevented at destination",
          details: `Bin (${toBin.x},${toBin.y},${toBin.z}) capacity: ${maxQty}. Current: ${toCurrent}. Cannot add ${qty}.`,
        },
        { status: 400 }
      );
    }

    const newFromQty = available - qty;

    if (newFromQty <= 0) {
      await supabase
        .from("bin_allocations")
        .delete()
        .eq("id", fromAlloc.id)
        .eq("tenant_id", t.tenantId);
    } else {
      await supabase
        .from("bin_allocations")
        .update({ quantity: newFromQty, updated_at: new Date().toISOString() })
        .eq("id", fromAlloc.id)
        .eq("tenant_id", t.tenantId);
    }

    const { data: toExisting } = await supabase
      .from("bin_allocations")
      .select("id, quantity")
      .eq("bin_id", to_bin_id)
      .eq("product_id", product_id)
      .eq("tenant_id", t.tenantId)
      .maybeSingle();

    if (toExisting) {
      await supabase
        .from("bin_allocations")
        .update({
          quantity: (toExisting.quantity || 0) + qty,
          updated_at: new Date().toISOString(),
        })
        .eq("id", toExisting.id)
        .eq("tenant_id", t.tenantId);
    } else {
      await supabase.from("bin_allocations").insert({
        tenant_id: t.tenantId,
        bin_id: to_bin_id,
        product_id,
        quantity: qty,
      });
    }

    return NextResponse.json({
      success: true,
      message: `Moved ${qty} units to bin (${toBin.x},${toBin.y},${toBin.z})`,
      from_bin_id,
      to_bin_id,
      coordinates: { x: toBin.x, y: toBin.y, z: toBin.z },
    });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
