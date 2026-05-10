import { NextRequest, NextResponse } from "next/server";
import { createAdminServiceClient } from "@/lib/supabase/admin-service";
import { requireTenantId } from "@/lib/tenants/context";
import { layoutBelongsToTenant, sectionBelongsToTenant } from "@/lib/tenants/warehouse-scope";

// GET - Get all sections for a layout
export async function GET(request: NextRequest) {
  const t = requireTenantId(request);
  if (t instanceof NextResponse) return t;
  try {
    const supabase = createAdminServiceClient();
    const { searchParams } = new URL(request.url);
    const layoutId = searchParams.get("layout_id");

    if (!layoutId) {
      return NextResponse.json(
        { error: "layout_id is required" },
        { status: 400 }
      );
    }

    const okLayout = await layoutBelongsToTenant(supabase, layoutId, t.tenantId);
    if (!okLayout) {
      return NextResponse.json({ error: "Layout not found" }, { status: 404 });
    }

    const { data: sections, error } = await supabase
      .from("warehouse_sections")
      .select("*")
      .eq("layout_id", layoutId)
      .eq("tenant_id", t.tenantId)
      .order("row_index, column_index");

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    const sectionIds = (sections || []).map((s: { id: string }) => s.id);
    let allInventory: { id?: string; section_id?: string; product_id?: string; quantity?: number; notes?: string }[] =
      [];
    if (sectionIds.length > 0) {
      const { data: invData, error: inventoryError } = await supabase
        .from("section_inventory")
        .select("id, section_id, product_id, quantity, notes")
        .in("section_id", sectionIds)
        .eq("tenant_id", t.tenantId);

      if (inventoryError) {
        console.error("Error loading inventory:", inventoryError);
      } else {
        allInventory = invData || [];
      }
    }

    const productIds = Array.from(
      new Set((allInventory || []).map((inv: { product_id?: string }) => inv.product_id).filter(Boolean))
    );

    let productsMap: Record<string, unknown> = {};
    if (productIds.length > 0) {
      const { data: products, error: productsError } = await supabase
        .from("products")
        .select("id, name, sku, price, category, condition, quantity, dimensions")
        .in("id", productIds as string[])
        .eq("tenant_id", t.tenantId);

      if (!productsError && products) {
        productsMap = (products as { id: string }[]).reduce((acc: Record<string, unknown>, p) => {
          const key = p?.id != null ? String(p.id) : "";
          if (key) acc[key] = p;
          return acc;
        }, {});
      }
    }

    const sectionsWithUsage = (sections || []).map((section: { id: string; capacity?: number }) => {
      const sectionId = section?.id != null ? String(section.id) : "";
      const sectionInventory = (allInventory || []).filter(
        (inv: { section_id?: string }) => inv.section_id != null && String(inv.section_id) === sectionId
      );
      const totalQuantity =
        sectionInventory.reduce((sum: number, inv: { quantity?: number }) => sum + (inv.quantity || 0), 0) || 0;

      const usagePercentage = section.capacity && section.capacity > 0
        ? (totalQuantity / section.capacity) * 100
        : 0;

      const inventoryWithProducts = sectionInventory.map((inv: { product_id?: string }) => ({
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
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

// POST - Create or update a section
export async function POST(request: NextRequest) {
  const t = requireTenantId(request);
  if (t instanceof NextResponse) return t;
  try {
    const supabase = createAdminServiceClient();
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
      notes,
    } = body;

    if (!layout_id || row_index === undefined || column_index === undefined) {
      return NextResponse.json(
        { error: "layout_id, row_index, and column_index are required" },
        { status: 400 }
      );
    }

    const okLayout = await layoutBelongsToTenant(supabase, layout_id, t.tenantId);
    if (!okLayout) {
      return NextResponse.json({ error: "Layout not found" }, { status: 404 });
    }

    const { data: existingSection } = await supabase
      .from("warehouse_sections")
      .select("id")
      .eq("layout_id", layout_id)
      .eq("tenant_id", t.tenantId)
      .eq("row_index", row_index)
      .eq("column_index", column_index)
      .single();

    let section;
    if (existingSection) {
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
        .eq("tenant_id", t.tenantId)
        .select()
        .single();

      if (error) throw error;
      section = data;
    } else {
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
          tenant_id: t.tenantId,
          ...(notes !== undefined && { notes }),
        })
        .select()
        .single();

      if (error) throw error;
      section = data;
    }

    return NextResponse.json({ section });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

// DELETE - Delete a section
export async function DELETE(request: NextRequest) {
  const t = requireTenantId(request);
  if (t instanceof NextResponse) return t;
  try {
    const supabase = createAdminServiceClient();
    const { searchParams } = new URL(request.url);
    const sectionId = searchParams.get("section_id");

    if (!sectionId) {
      return NextResponse.json(
        { error: "section_id is required" },
        { status: 400 }
      );
    }

    const ok = await sectionBelongsToTenant(supabase, sectionId, t.tenantId);
    if (!ok) {
      return NextResponse.json({ error: "Section not found" }, { status: 404 });
    }

    const { error } = await supabase
      .from("warehouse_sections")
      .delete()
      .eq("id", sectionId)
      .eq("tenant_id", t.tenantId);

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
