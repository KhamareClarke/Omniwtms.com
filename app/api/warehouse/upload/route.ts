import { NextRequest, NextResponse } from "next/server";
import { createAdminServiceClient } from "@/lib/supabase/admin-service";
import { requireTenantId } from "@/lib/tenants/context";
import { warehouseBelongsToTenant } from "@/lib/tenants/warehouse-scope";
import { writeFile } from "fs/promises";
import { join } from "path";
import { v4 as uuidv4 } from "uuid";

export async function POST(request: NextRequest) {
  const t = requireTenantId(request);
  if (t instanceof NextResponse) return t;
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;
    const warehouseId = formData.get("warehouseId") as string;
    const name = (formData.get("name") as string) || "Warehouse Floor Plan";
    const description = (formData.get("description") as string) || "Uploaded floor plan";

    if (!file) {
      return NextResponse.json(
        { error: "No file provided" },
        { status: 400 }
      );
    }

    if (!file.type.includes("image/png")) {
      return NextResponse.json(
        { error: "Only PNG files are allowed" },
        { status: 400 }
      );
    }

    const supabase = createAdminServiceClient();
    const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    let effectiveWarehouseId: string | null =
      warehouseId && uuidPattern.test(warehouseId) ? warehouseId : null;

    if (!effectiveWarehouseId) {
      const { data: firstWarehouse } = await supabase
        .from("warehouses")
        .select("id")
        .eq("tenant_id", t.tenantId)
        .limit(1)
        .maybeSingle();
      effectiveWarehouseId = firstWarehouse?.id ?? null;
    }

    if (!effectiveWarehouseId) {
      return NextResponse.json(
        { error: "No warehouse found for this organization" },
        { status: 404 }
      );
    }

    const allowed = await warehouseBelongsToTenant(supabase, effectiveWarehouseId, t.tenantId);
    if (!allowed) {
      return NextResponse.json({ error: "Warehouse not found" }, { status: 404 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const uniqueId = uuidv4();
    const filename = `floorplan-${uniqueId}.png`;
    const publicDir = join(process.cwd(), "public", "uploads");
    const filePath = join(publicDir, filename);

    await writeFile(filePath, buffer);

    const fileUrl = `/uploads/${filename}`;

    await supabase
      .from("warehouse_floor_plans")
      .update({ is_active: false })
      .eq("warehouse_id", effectiveWarehouseId)
      .eq("tenant_id", t.tenantId);

    const { data: floorPlan, error } = await supabase
      .from("warehouse_floor_plans")
      .insert({
        warehouse_id: effectiveWarehouseId,
        name,
        description,
        file_path: fileUrl,
        is_active: true,
        uploaded_by: "admin",
        uploaded_at: new Date().toISOString(),
        tenant_id: t.tenantId,
      })
      .select()
      .single();

    if (error) {
      console.error("Error saving floor plan to database:", error);
      return NextResponse.json(
        { error: "Failed to save floor plan to database" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Floor plan uploaded successfully",
      floorPlan,
    });
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}
