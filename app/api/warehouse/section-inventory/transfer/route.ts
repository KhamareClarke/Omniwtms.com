import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/** POST - Transfer stock between sections with capacity validation at destination */
export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();
    const body = await request.json();
    const { from_section_id, to_section_id, product_id, quantity, notes } = body;

    if (!from_section_id || !to_section_id || !product_id || quantity == null || quantity < 1) {
      return NextResponse.json(
        { error: "from_section_id, to_section_id, product_id, and quantity (>=1) are required" },
        { status: 400 }
      );
    }

    if (from_section_id === to_section_id) {
      return NextResponse.json({ error: "Source and destination must be different" }, { status: 400 });
    }

    const qty = parseInt(String(quantity)) || 0;
    if (qty < 1) return NextResponse.json({ error: "quantity must be at least 1" }, { status: 400 });

    const { data: sourceInv, error: srcErr } = await supabase
      .from("section_inventory")
      .select("id, quantity")
      .eq("section_id", from_section_id)
      .eq("product_id", product_id)
      .maybeSingle();

    if (srcErr || !sourceInv) {
      return NextResponse.json({ error: "Product not found in source section" }, { status: 404 });
    }

    if ((sourceInv.quantity || 0) < qty) {
      return NextResponse.json(
        { error: `Insufficient quantity. Available: ${sourceInv.quantity}. Requested: ${qty}.` },
        { status: 400 }
      );
    }

    const { data: toSection, error: secErr } = await supabase
      .from("warehouse_sections")
      .select("id, capacity")
      .eq("id", to_section_id)
      .single();

    if (secErr || !toSection) {
      return NextResponse.json({ error: "Destination section not found" }, { status: 404 });
    }

    const capacity = toSection.capacity ?? 0;
    const { data: toInv } = await supabase
      .from("section_inventory")
      .select("quantity")
      .eq("section_id", to_section_id);

    const toTotal = toInv?.reduce((s, i) => s + (i.quantity || 0), 0) ?? 0;
    if (capacity > 0 && toTotal + qty > capacity) {
      return NextResponse.json(
        {
          error: "Over-allocation prevented at destination",
          details: `Section capacity: ${capacity}. Current: ${toTotal}. Cannot add ${qty}.`,
        },
        { status: 400 }
      );
    }

    const newSourceQty = (sourceInv.quantity || 0) - qty;
    if (newSourceQty <= 0) {
      await supabase.from("section_inventory").delete().eq("id", sourceInv.id);
    } else {
      await supabase
        .from("section_inventory")
        .update({ quantity: newSourceQty, updated_at: new Date().toISOString() })
        .eq("id", sourceInv.id);
    }

    const { data: destInv } = await supabase
      .from("section_inventory")
      .select("id, quantity")
      .eq("section_id", to_section_id)
      .eq("product_id", product_id)
      .maybeSingle();

    const note = notes || `Transferred from section ${from_section_id}`;
    if (destInv) {
      await supabase
        .from("section_inventory")
        .update({
          quantity: (destInv.quantity || 0) + qty,
          notes: note,
          updated_at: new Date().toISOString(),
        })
        .eq("id", destInv.id);
    } else {
      await supabase.from("section_inventory").insert({
        section_id: to_section_id,
        product_id,
        quantity: qty,
        notes: note,
      });
    }

    return NextResponse.json({
      success: true,
      message: `Transferred ${qty} units between sections`,
    });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Internal server error" }, { status: 500 });
  }
}
