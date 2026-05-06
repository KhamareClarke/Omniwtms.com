import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * POST /api/warehouse/save-layout
 * Saves layout and sections in one request.
 * Body: { warehouse_id, image_url?, image_width?, image_height?, grid_rows?, grid_columns?, sections?: [...] }
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();
    const body = await request.json();
    const {
      warehouse_id,
      image_url,
      image_width,
      image_height,
      grid_rows,
      grid_columns,
      sections = [],
    } = body;

    if (!warehouse_id) {
      return NextResponse.json(
        { error: "warehouse_id is required" },
        { status: 400 }
      );
    }

    // 1. Get or create layout
    const { data: existingLayout } = await supabase
      .from("warehouse_layouts")
      .select("id")
      .eq("warehouse_id", warehouse_id)
      .limit(1)
      .single();

    let layoutId: string;

    if (existingLayout) {
      layoutId = existingLayout.id;
      const updates: Record<string, unknown> = {
        updated_at: new Date().toISOString(),
      };
      if (image_url != null) updates.image_url = image_url;
      if (image_width != null) updates.image_width = image_width;
      if (image_height != null) updates.image_height = image_height;
      if (grid_rows != null) updates.grid_rows = grid_rows;
      if (grid_columns != null) updates.grid_columns = grid_columns;

      const { error: updateError } = await supabase
        .from("warehouse_layouts")
        .update(updates)
        .eq("id", layoutId);

      if (updateError) throw updateError;
    } else {
      if (!image_url) {
        return NextResponse.json(
          { error: "image_url is required when creating a new layout" },
          { status: 400 }
        );
      }

      const { data: newLayout, error: insertError } = await supabase
        .from("warehouse_layouts")
        .insert({
          warehouse_id,
          image_url,
          image_width: image_width ?? null,
          image_height: image_height ?? null,
          grid_rows: grid_rows ?? 10,
          grid_columns: grid_columns ?? 10,
        })
        .select("id")
        .single();

      if (insertError) throw insertError;
      layoutId = newLayout.id;
    }

    // 2. Upsert sections
    const savedSections: unknown[] = [];
    for (const s of sections) {
      const {
        row_index,
        column_index,
        section_name,
        section_type,
        capacity,
        is_blocked,
        color,
        notes,
      } = s;

      if (
        row_index === undefined ||
        column_index === undefined
      ) {
        continue;
      }

      const { data: existingSection } = await supabase
        .from("warehouse_sections")
        .select("id")
        .eq("layout_id", layoutId)
        .eq("row_index", row_index)
        .eq("column_index", column_index)
        .single();

      const sectionPayload = {
        layout_id: layoutId,
        row_index,
        column_index,
        section_name: section_name ?? `Section ${row_index}-${column_index}`,
        section_type: section_type ?? "storage",
        capacity: capacity ?? 0,
        is_blocked: is_blocked ?? false,
        color: color ?? null,
        notes: notes ?? null,
        updated_at: new Date().toISOString(),
      };

      if (existingSection) {
        const { data: updated, error } = await supabase
          .from("warehouse_sections")
          .update(sectionPayload)
          .eq("id", existingSection.id)
          .select()
          .single();

        if (error) throw error;
        savedSections.push(updated);
      } else {
        const { data: inserted, error } = await supabase
          .from("warehouse_sections")
          .insert(sectionPayload)
          .select()
          .single();

        if (error) throw error;
        savedSections.push(inserted);
      }
    }

    // 3. Fetch full layout
    const { data: layout, error: layoutError } = await supabase
      .from("warehouse_layouts")
      .select("*")
      .eq("id", layoutId)
      .single();

    if (layoutError) throw layoutError;

    return NextResponse.json({
      layout,
      sections: savedSections,
    });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
