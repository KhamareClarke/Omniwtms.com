import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// POST - Move stock to a section
export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();
    const body = await request.json();
    const { section_id, product_id, quantity, notes } = body;

    if (!section_id || !product_id || !quantity) {
      return NextResponse.json(
        { error: "section_id, product_id, and quantity are required" },
        { status: 400 }
      );
    }

    // Get section capacity and enforce over-allocation prevention
    const { data: section, error: sectionErr } = await supabase
      .from("warehouse_sections")
      .select("id, capacity")
      .eq("id", section_id)
      .single();

    if (sectionErr || !section) {
      return NextResponse.json({ error: "Section not found" }, { status: 404 });
    }

    const capacity = section.capacity ?? 0;
    const { data: currentInventory } = await supabase
      .from("section_inventory")
      .select("quantity")
      .eq("section_id", section_id);

    const currentTotal = currentInventory?.reduce((sum, inv) => sum + (inv.quantity || 0), 0) ?? 0;
    if (capacity > 0 && currentTotal + quantity > capacity) {
      return NextResponse.json(
        {
          error: "Over-allocation prevented",
          details: `Section capacity is ${capacity}. Current: ${currentTotal}. Cannot add ${quantity}.`,
        },
        { status: 400 }
      );
    }

    // Check if inventory already exists for this section and product
    const { data: existingInventory } = await supabase
      .from("section_inventory")
      .select("id, quantity")
      .eq("section_id", section_id)
      .eq("product_id", product_id)
      .single();

    let inventory;
    if (existingInventory) {
      // Update existing inventory
      const { data, error } = await supabase
        .from("section_inventory")
        .update({
          quantity: existingInventory.quantity + quantity,
          notes,
          updated_at: new Date().toISOString(),
        })
        .eq("id", existingInventory.id)
        .select()
        .single();

      if (error) throw error;
      inventory = data;
    } else {
      // Create new inventory entry
      const { data, error } = await supabase
        .from("section_inventory")
        .insert({
          section_id,
          product_id,
          quantity,
          notes,
        })
        .select()
        .single();

      if (error) throw error;
      inventory = data;
    }

    // Update section current_usage
    const { data: allInventory } = await supabase
      .from("section_inventory")
      .select("quantity")
      .eq("section_id", section_id);

    const totalQuantity = allInventory?.reduce(
      (sum, inv) => sum + (inv.quantity || 0),
      0
    ) || 0;

    await supabase
      .from("warehouse_sections")
      .update({
        current_usage: totalQuantity,
        updated_at: new Date().toISOString(),
      })
      .eq("id", section_id);

    return NextResponse.json({ inventory });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}

// GET - Get inventory for a section
export async function GET(request: NextRequest) {
  try {
    const supabase = createClient();
    const { searchParams } = new URL(request.url);
    const sectionId = searchParams.get("section_id");

    if (!sectionId) {
      return NextResponse.json(
        { error: "section_id is required" },
        { status: 400 }
      );
    }

    const { data: inventory, error } = await supabase
      .from("section_inventory")
      .select(`
        *,
        products:product_id (
          id,
          name,
          sku,
          category
        )
      `)
      .eq("section_id", sectionId)
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ inventory: inventory || [] });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}

