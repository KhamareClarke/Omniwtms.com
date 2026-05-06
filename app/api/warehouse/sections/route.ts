import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// GET - Get all sections for a layout
export async function GET(request: NextRequest) {
  try {
    const supabase = createClient();
    const { searchParams } = new URL(request.url);
    const layoutId = searchParams.get("layout_id");

    if (!layoutId) {
      return NextResponse.json(
        { error: "layout_id is required" },
        { status: 400 }
      );
    }

    const { data: sections, error } = await supabase
      .from("warehouse_sections")
      .select("*")
      .eq("layout_id", layoutId)
      .order("row_index, column_index");

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    // Get all inventory for these sections
    const sectionIds = (sections || []).map((s: any) => s.id);
    const { data: allInventory, error: inventoryError } = await supabase
      .from("section_inventory")
      .select("id, section_id, product_id, quantity, notes")
      .in("section_id", sectionIds);

    if (inventoryError) {
      console.error("Error loading inventory:", inventoryError);
    }

    // Get all product IDs
    const productIds = Array.from(new Set((allInventory || []).map((inv: any) => inv.product_id).filter(Boolean)));
    
    // Fetch products
    let productsMap: Record<string, any> = {};
    if (productIds.length > 0) {
      const { data: products, error: productsError } = await supabase
        .from("products")
        .select("id, name, sku, price, category, condition, quantity, dimensions")
        .in("id", productIds);

      if (!productsError && products) {
        productsMap = products.reduce((acc: any, p: any) => {
          const key = p?.id != null ? String(p.id) : "";
          if (key) acc[key] = p;
          return acc;
        }, {});
      }
    }

    // Calculate usage for each section and attach inventory with products
    const sectionsWithUsage = (sections || []).map((section: any) => {
      const sectionId = section?.id != null ? String(section.id) : "";
      const sectionInventory = (allInventory || []).filter(
        (inv: any) => inv.section_id != null && String(inv.section_id) === sectionId
      );
      const totalQuantity = sectionInventory.reduce(
        (sum: number, inv: any) => sum + (inv.quantity || 0),
        0
      ) || 0;
      
      const usagePercentage = section.capacity > 0 
        ? (totalQuantity / section.capacity) * 100 
        : 0;

      // Attach products to inventory
      const inventoryWithProducts = sectionInventory.map((inv: any) => ({
        ...inv,
        products: inv.product_id != null ? (productsMap[String(inv.product_id)] ?? null) : null,
      }));

      return {
        ...section,
        current_usage: totalQuantity,
        usage_percentage: usagePercentage,
        section_inventory: inventoryWithProducts,
      };
    });

    return NextResponse.json({ sections: sectionsWithUsage });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}

// POST - Create or update a section
export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();
    const body = await request.json();
    const { 
      layout_id, 
      row_index, 
      column_index, 
      section_name, 
      section_type, 
      capacity, 
      is_blocked,
      color,
      notes 
    } = body;

    if (!layout_id || row_index === undefined || column_index === undefined) {
      return NextResponse.json(
        { error: "layout_id, row_index, and column_index are required" },
        { status: 400 }
      );
    }

    // Check if section exists
    const { data: existingSection } = await supabase
      .from("warehouse_sections")
      .select("id")
      .eq("layout_id", layout_id)
      .eq("row_index", row_index)
      .eq("column_index", column_index)
      .single();

    let section;
    if (existingSection) {
      // Update existing section
      const updates: Record<string, unknown> = {
        section_name: section_name || `Section ${row_index}-${column_index}`,
        section_type: section_type || "storage",
        capacity: capacity || 0,
        is_blocked: is_blocked || false,
        color,
        updated_at: new Date().toISOString(),
      };
      if (notes !== undefined) updates.notes = notes;
      const { data, error } = await supabase
        .from("warehouse_sections")
        .update(updates)
        .eq("id", existingSection.id)
        .select()
        .single();

      if (error) throw error;
      section = data;
    } else {
      // Create new section
      const { data, error } = await supabase
        .from("warehouse_sections")
        .insert({
          layout_id,
          row_index,
          column_index,
          section_name: section_name || `Section ${row_index}-${column_index}`,
          section_type: section_type || "storage",
          capacity: capacity ?? 0,
          is_blocked: is_blocked || false,
          color,
          ...(notes !== undefined && { notes }),
        })
        .select()
        .single();

      if (error) throw error;
      section = data;
    }

    return NextResponse.json({ section });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE - Delete a section
export async function DELETE(request: NextRequest) {
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

    const { error } = await supabase
      .from("warehouse_sections")
      .delete()
      .eq("id", sectionId);

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}

