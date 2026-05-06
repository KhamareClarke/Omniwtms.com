import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/** POST - Allocate product to a bin (3D location) with capacity validation */
export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();
    const body = await request.json();
    const { bin_id, product_id, quantity, volume_used, client_id } = body;

    if (!bin_id || !product_id || quantity == null || quantity < 1) {
      return NextResponse.json(
        { error: "bin_id, product_id, and quantity (>=1) are required" },
        { status: 400 }
      );
    }

    const qty = parseInt(String(quantity)) || 0;
    if (qty < 1) {
      return NextResponse.json({ error: "quantity must be at least 1" }, { status: 400 });
    }

    const { data: bin, error: binErr } = await supabase
      .from("warehouse_bins")
      .select("id, max_quantity, max_volume, x, y, z")
      .eq("id", bin_id)
      .single();

    if (binErr || !bin) {
      return NextResponse.json({ error: "Bin not found" }, { status: 404 });
    }

    const maxQty = bin.max_quantity ?? 0;
    const maxVol = parseFloat(String(bin.max_volume)) || 0;
    const volUsed = parseFloat(String(volume_used || 0)) || 0;

    const { data: allocations } = await supabase
      .from("bin_allocations")
      .select("quantity, volume_used")
      .eq("bin_id", bin_id);

    const currentQty = allocations?.reduce((s: number, a: any) => s + (a.quantity || 0), 0) ?? 0;
    const currentVol = allocations?.reduce((s: number, a: any) => s + parseFloat(String(a.volume_used || 0)), 0) ?? 0;

    if (maxQty > 0 && currentQty + qty > maxQty) {
      return NextResponse.json(
        {
          error: "Over-allocation prevented",
          details: `Bin (${bin.x},${bin.y},${bin.z}) capacity: ${maxQty}. Current: ${currentQty}. Cannot add ${qty}.`,
        },
        { status: 400 }
      );
    }

    if (maxVol > 0 && currentVol + volUsed > maxVol) {
      return NextResponse.json(
        {
          error: "Volume over-allocation prevented",
          details: `Bin max volume: ${maxVol}. Current: ${currentVol}. Cannot add ${volUsed}.`,
        },
        { status: 400 }
      );
    }

    const { data: existing } = await supabase
      .from("bin_allocations")
      .select("id, quantity, volume_used")
      .eq("bin_id", bin_id)
      .eq("product_id", product_id)
      .single();

    if (existing) {
      const newQty = (existing.quantity || 0) + qty;
      const newVol = parseFloat(String(existing.volume_used || 0)) + volUsed;

      const { data: updated, error: updErr } = await supabase
        .from("bin_allocations")
        .update({ quantity: newQty, volume_used: newVol, updated_at: new Date().toISOString() })
        .eq("id", existing.id)
        .select()
        .single();

      if (updErr) return NextResponse.json({ error: updErr.message }, { status: 500 });
      return NextResponse.json({
        allocation: updated,
        action: "updated",
        coordinates: { x: bin.x, y: bin.y, z: bin.z },
      });
    }

    const { data: inserted, error: insErr } = await supabase
      .from("bin_allocations")
      .insert({
        bin_id,
        product_id,
        quantity: qty,
        volume_used: volUsed,
        client_id: client_id || null,
      })
      .select()
      .single();

    if (insErr) return NextResponse.json({ error: insErr.message }, { status: 500 });
    return NextResponse.json({
      allocation: inserted,
      action: "created",
      coordinates: { x: bin.x, y: bin.y, z: bin.z },
    });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Internal server error" }, { status: 500 });
  }
}
