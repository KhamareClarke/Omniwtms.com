import { NextRequest, NextResponse } from "next/server";
import { createAdminServiceClient } from "@/lib/supabase/admin-service";
import { requireTenantId } from "@/lib/tenants/context";
import { warehouseBelongsToTenant } from "@/lib/tenants/warehouse-scope";

/** GET - List bins for a warehouse (optional: filter by section, coordinates) */
export async function GET(request: NextRequest) {
  const t = requireTenantId(request);
  if (t instanceof NextResponse) return t;

  try {
    const supabase = createAdminServiceClient();
    const { searchParams } = new URL(request.url);
    const warehouseId = searchParams.get("warehouse_id");
    const sectionId = searchParams.get("section_id");
    const x = searchParams.get("x");
    const y = searchParams.get("y");
    const z = searchParams.get("z");

    if (!warehouseId) {
      return NextResponse.json({ error: "warehouse_id is required" }, { status: 400 });
    }

    const allowed = await warehouseBelongsToTenant(supabase, warehouseId, t.tenantId);
    if (!allowed) {
      return NextResponse.json({ error: "Warehouse not found" }, { status: 404 });
    }

    let query = supabase
      .from("warehouse_bins")
      .select(
        `
        *,
        bin_allocations (
          id,
          product_id,
          quantity,
          volume_used,
          products:product_id (id, name, sku)
        )
      `
      )
      .eq("warehouse_id", warehouseId)
      .eq("tenant_id", t.tenantId)
      .order("x")
      .order("y")
      .order("z");

    if (sectionId) query = query.eq("section_id", sectionId);
    if (x != null && x !== "") query = query.eq("x", parseInt(x, 10));
    if (y != null && y !== "") query = query.eq("y", parseInt(y, 10));
    if (z != null && z !== "") query = query.eq("z", parseInt(z, 10));

    const { data, error } = await query;

    if (error) {
      if (error.code === "42P01" || error.message?.includes("does not exist")) {
        return NextResponse.json(
          { error: "warehouse_bins table not found. Run migration: npx supabase db push" },
          { status: 503 }
        );
      }
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ bins: data ?? [] });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/** POST - Create a bin or allocate stock (body.allocate = true) */
export async function POST(request: NextRequest) {
  const t = requireTenantId(request);
  if (t instanceof NextResponse) return t;

  try {
    const supabase = createAdminServiceClient();
    const body = await request.json();

    if (body.allocate === true) {
      return handleAllocate(supabase, body, t.tenantId);
    }

    const { warehouse_id, section_id, x, y, z, max_quantity, max_volume, bin_code } = body;

    if (!warehouse_id || x === undefined || y === undefined || z === undefined) {
      return NextResponse.json(
        { error: "warehouse_id, x, y, z are required" },
        { status: 400 }
      );
    }

    const allowed = await warehouseBelongsToTenant(supabase, warehouse_id, t.tenantId);
    if (!allowed) {
      return NextResponse.json({ error: "Warehouse not found" }, { status: 404 });
    }

    const maxQty = parseInt(String(max_quantity ?? 100), 10) || 100;

    const { data, error } = await supabase
      .from("warehouse_bins")
      .insert({
        tenant_id: t.tenantId,
        warehouse_id,
        section_id: section_id || null,
        x: parseInt(String(x), 10),
        y: parseInt(String(y), 10),
        z: parseInt(String(z), 10),
        max_quantity: maxQty,
        max_volume: max_volume ?? 0,
        bin_code: bin_code || null,
      })
      .select()
      .single();

    if (error) {
      console.error("[bins POST] Supabase error:", error);
      if (error.code === "23505") {
        return NextResponse.json(
          { error: "Bin at (x,y,z) already exists for this warehouse" },
          { status: 409 }
        );
      }
      if (error.code === "42P01" || error.message?.includes("does not exist")) {
        return NextResponse.json(
          {
            error:
              "warehouse_bins table not found. Run migration: 20250614000000_3d_spatial_allocation_engine.sql",
          },
          { status: 503 }
        );
      }
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ bin: data });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

async function handleAllocate(supabase: ReturnType<typeof createAdminServiceClient>, body: any, tenantId: string) {
  const { bin_id, product_id, quantity, volume_used, client_id } = body;

  if (!bin_id || !product_id || quantity == null || quantity < 1) {
    return NextResponse.json(
      { error: "bin_id, product_id, and quantity (>=1) are required for allocate" },
      { status: 400 }
    );
  }

  const qty = parseInt(String(quantity), 10) || 0;
  if (qty < 1) {
    return NextResponse.json({ error: "quantity must be at least 1" }, { status: 400 });
  }

  const { data: productRow } = await supabase
    .from("products")
    .select("id")
    .eq("id", product_id)
    .eq("tenant_id", tenantId)
    .maybeSingle();

  if (!productRow) {
    return NextResponse.json({ error: "Product not found" }, { status: 404 });
  }

  const { data: bin, error: binErr } = await supabase
    .from("warehouse_bins")
    .select("id, max_quantity, max_volume, current_quantity, current_volume")
    .eq("id", bin_id)
    .eq("tenant_id", tenantId)
    .single();

  if (binErr || !bin) {
    return NextResponse.json({ error: "Bin not found" }, { status: 404 });
  }

  const maxQty = bin.max_quantity ?? 0;
  const maxVol = parseFloat(String(bin.max_volume)) || 0;
  const volUsed = parseFloat(String(volume_used || 0)) || 0;

  if (maxQty > 0) {
    const { data: allocations } = await supabase
      .from("bin_allocations")
      .select("quantity, volume_used")
      .eq("bin_id", bin_id)
      .eq("tenant_id", tenantId);

    const currentQty = allocations?.reduce((s: number, a: { quantity?: number }) => s + (a.quantity || 0), 0) ?? 0;
    const currentVol =
      allocations?.reduce(
        (s: number, a: { volume_used?: number | string }) => s + parseFloat(String(a.volume_used || 0)),
        0
      ) ?? 0;

    if (currentQty + qty > maxQty) {
      return NextResponse.json(
        {
          error: "Over-allocation prevented",
          details: `Bin capacity: ${maxQty}. Current: ${currentQty}. Cannot add ${qty}.`,
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
  }

  const { data: existing } = await supabase
    .from("bin_allocations")
    .select("id, quantity, volume_used")
    .eq("bin_id", bin_id)
    .eq("product_id", product_id)
    .eq("tenant_id", tenantId)
    .maybeSingle();

  if (existing) {
    const newQty = (existing.quantity || 0) + qty;
    const newVol = parseFloat(String(existing.volume_used || 0)) + volUsed;

    const { data: updated, error: updErr } = await supabase
      .from("bin_allocations")
      .update({ quantity: newQty, volume_used: newVol, updated_at: new Date().toISOString() })
      .eq("id", existing.id)
      .eq("tenant_id", tenantId)
      .select()
      .single();

    if (updErr) return NextResponse.json({ error: updErr.message }, { status: 500 });
    return NextResponse.json({ allocation: updated, action: "updated" });
  }

  const { data: inserted, error: insErr } = await supabase
    .from("bin_allocations")
    .insert({
      tenant_id: tenantId,
      bin_id,
      product_id,
      quantity: qty,
      volume_used: volUsed,
      client_id: client_id || null,
    })
    .select()
    .single();

  if (insErr) return NextResponse.json({ error: insErr.message }, { status: 500 });
  return NextResponse.json({ allocation: inserted, action: "created" });
}
