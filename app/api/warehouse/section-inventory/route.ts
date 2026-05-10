import { NextRequest, NextResponse } from "next/server";
import { createAdminServiceClient } from "@/lib/supabase/admin-service";
import { requireTenantId } from "@/lib/tenants/context";
import { sectionBelongsToTenant } from "@/lib/tenants/warehouse-scope";

// POST - Move stock to a section
export async function POST(request: NextRequest) {
  const t = requireTenantId(request);
  if (t instanceof NextResponse) return t;
  try {
    const supabase = createAdminServiceClient();
    const body = await request.json();
    const { section_id, product_id, quantity, notes } = body;

    if (!section_id || !product_id || !quantity) {
      return NextResponse.json(
        { error: "section_id, product_id, and quantity are required" },
        { status: 400 }
      );
    }

    const okSec = await sectionBelongsToTenant(supabase, section_id, t.tenantId);
    if (!okSec) {
      return NextResponse.json({ error: "Section not found" }, { status: 404 });
    }

    const { data: section, error: sectionErr } = await supabase
      .from("warehouse_sections")
      .select("id, capacity")
      .eq("id", section_id)
      .eq("tenant_id", t.tenantId)
      .single();

    if (sectionErr || !section) {
      return NextResponse.json({ error: "Section not found" }, { status: 404 });
    }

    const capacity = section.capacity ?? 0;
    const { data: currentInventory } = await supabase
      .from("section_inventory")
      .select("quantity")
      .eq("section_id", section_id)
      .eq("tenant_id", t.tenantId);

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

    const { data: existingInventory } = await supabase
      .from("section_inventory")
      .select("id, quantity")
      .eq("section_id", section_id)
      .eq("product_id", product_id)
      .eq("tenant_id", t.tenantId)
      .single();

    let inventory;
    if (existingInventory) {
      const { data, error } = await supabase
        .from("section_inventory")
        .update({
          quantity: existingInventory.quantity + quantity,
          notes,
          updated_at: new Date().toISOString(),
        })
        .eq("id", existingInventory.id)
        .eq("tenant_id", t.tenantId)
        .select()
        .single();

      if (error) throw error;
      inventory = data;
    } else {
      const { data, error } = await supabase
        .from("section_inventory")
        .insert({
          section_id,
          product_id,
          quantity,
          notes,
          tenant_id: t.tenantId,
        })
        .select()
        .single();

      if (error) throw error;
      inventory = data;
    }

    const { data: allInventory } = await supabase
      .from("section_inventory")
      .select("quantity")
      .eq("section_id", section_id)
      .eq("tenant_id", t.tenantId);

    const totalQuantity =
      allInventory?.reduce((sum, inv) => sum + (inv.quantity || 0), 0) || 0;

    await supabase
      .from("warehouse_sections")
      .update({
        current_usage: totalQuantity,
        updated_at: new Date().toISOString(),
      })
      .eq("id", section_id)
      .eq("tenant_id", t.tenantId);

    return NextResponse.json({ inventory });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

// GET - Get inventory for a section
export async function GET(request: NextRequest) {
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
      .eq("tenant_id", t.tenantId)
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ inventory: inventory || [] });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
