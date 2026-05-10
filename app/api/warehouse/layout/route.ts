import { NextRequest, NextResponse } from "next/server";
import { createAdminServiceClient } from "@/lib/supabase/admin-service";
import { requireTenantId } from "@/lib/tenants/context";
import { warehouseBelongsToTenant } from "@/lib/tenants/warehouse-scope";

// GET - Get layout for a warehouse
export async function GET(request: NextRequest) {
  const t = requireTenantId(request);
  if (t instanceof NextResponse) return t;
  try {
    const supabase = createAdminServiceClient();
    const { searchParams } = new URL(request.url);
    const warehouseId = searchParams.get("warehouse_id");

    if (!warehouseId) {
      return NextResponse.json(
        { error: "warehouse_id is required" },
        { status: 400 }
      );
    }

    const allowed = await warehouseBelongsToTenant(supabase, warehouseId, t.tenantId);
    if (!allowed) {
      return NextResponse.json({ error: "Warehouse not found" }, { status: 404 });
    }

    const { data: layout, error: layoutError } = await supabase
      .from("warehouse_layouts")
      .select("*")
      .eq("warehouse_id", warehouseId)
      .eq("tenant_id", t.tenantId)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (layoutError && layoutError.code !== "PGRST116") {
      return NextResponse.json(
        { error: layoutError.message },
        { status: 500 }
      );
    }

    if (!layout) {
      return NextResponse.json({ layout: null, sections: [] });
    }

    const { data: sections, error: sectionsError } = await supabase
      .from("warehouse_sections")
      .select("*")
      .eq("layout_id", layout.id)
      .eq("tenant_id", t.tenantId)
      .order("row_index, column_index");

    if (sectionsError) {
      return NextResponse.json(
        { error: sectionsError.message },
        { status: 500 }
      );
    }

    const sectionsWithUsage = await Promise.all(
      (sections || []).map(async (section) => {
        const { data: inventory } = await supabase
          .from("section_inventory")
          .select("quantity")
          .eq("section_id", section.id)
          .eq("tenant_id", t.tenantId);

        const totalQuantity = inventory?.reduce((sum, inv) => sum + (inv.quantity || 0), 0) || 0;
        const usagePercentage = section.capacity > 0
          ? (totalQuantity / section.capacity) * 100
          : 0;

        return {
          ...section,
          current_usage: totalQuantity,
          usage_percentage: usagePercentage,
        };
      })
    );

    return NextResponse.json({
      layout,
      sections: sectionsWithUsage,
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

// PATCH - Update layout grid metadata only (no image required)
export async function PATCH(request: NextRequest) {
  const t = requireTenantId(request);
  if (t instanceof NextResponse) return t;
  try {
    const supabase = createAdminServiceClient();
    const body = await request.json();
    const { warehouse_id, grid_rows, grid_columns } = body;

    if (!warehouse_id) {
      return NextResponse.json(
        { error: "warehouse_id is required" },
        { status: 400 }
      );
    }

    const allowed = await warehouseBelongsToTenant(supabase, warehouse_id, t.tenantId);
    if (!allowed) {
      return NextResponse.json({ error: "Warehouse not found" }, { status: 404 });
    }

    const { data: existingLayout } = await supabase
      .from("warehouse_layouts")
      .select("id")
      .eq("warehouse_id", warehouse_id)
      .eq("tenant_id", t.tenantId)
      .limit(1)
      .single();

    if (!existingLayout) {
      return NextResponse.json(
        { error: "Layout not found. Create a layout with an image first." },
        { status: 404 }
      );
    }

    const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (grid_rows != null) updates.grid_rows = grid_rows;
    if (grid_columns != null) updates.grid_columns = grid_columns;

    const { data: layout, error } = await supabase
      .from("warehouse_layouts")
      .update(updates)
      .eq("id", existingLayout.id)
      .eq("tenant_id", t.tenantId)
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ layout });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

// POST - Create or update layout
export async function POST(request: NextRequest) {
  const t = requireTenantId(request);
  if (t instanceof NextResponse) return t;
  try {
    const supabase = createAdminServiceClient();
    const body = await request.json();
    const { warehouse_id, image_url, image_width, image_height, grid_rows, grid_columns } = body;

    if (!warehouse_id || !image_url) {
      return NextResponse.json(
        { error: "warehouse_id and image_url are required" },
        { status: 400 }
      );
    }

    const allowed = await warehouseBelongsToTenant(supabase, warehouse_id, t.tenantId);
    if (!allowed) {
      return NextResponse.json({ error: "Warehouse not found" }, { status: 404 });
    }

    const { data: existingLayout } = await supabase
      .from("warehouse_layouts")
      .select("id")
      .eq("warehouse_id", warehouse_id)
      .eq("tenant_id", t.tenantId)
      .limit(1)
      .single();

    let layout;
    if (existingLayout) {
      const { data, error } = await supabase
        .from("warehouse_layouts")
        .update({
          image_url,
          image_width,
          image_height,
          grid_rows: grid_rows ?? 10,
          grid_columns: grid_columns ?? 10,
          updated_at: new Date().toISOString(),
        })
        .eq("id", existingLayout.id)
        .eq("tenant_id", t.tenantId)
        .select()
        .single();

      if (error) throw error;
      layout = data;
    } else {
      const { data, error } = await supabase
        .from("warehouse_layouts")
        .insert({
          warehouse_id,
          image_url,
          image_width,
          image_height,
          grid_rows: grid_rows ?? 10,
          grid_columns: grid_columns ?? 10,
          tenant_id: t.tenantId,
        })
        .select()
        .single();

      if (error) throw error;
      layout = data;
    }

    return NextResponse.json({ layout });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
