import { NextRequest, NextResponse } from "next/server";
import { createAdminServiceClient } from "@/lib/supabase/admin-service";
import { requireTenantId } from "@/lib/tenants/context";
import { warehouseBelongsToTenant } from "@/lib/tenants/warehouse-scope";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function GET(request: NextRequest) {
  const t = requireTenantId(request);
  if (t instanceof NextResponse) return t;

  try {
    const { searchParams } = new URL(request.url);
    const warehouseId = searchParams.get("warehouseId");

    if (!warehouseId || !UUID_RE.test(warehouseId)) {
      return NextResponse.json(
        { error: "Valid warehouseId query parameter (UUID) is required" },
        { status: 400 }
      );
    }

    const supabase = createAdminServiceClient();

    const allowed = await warehouseBelongsToTenant(supabase, warehouseId, t.tenantId);
    if (!allowed) {
      return NextResponse.json({ error: "Warehouse not found" }, { status: 404 });
    }

    const { data: warehouse, error: warehouseError } = await supabase
      .from("warehouses")
      .select("*")
      .eq("id", warehouseId)
      .eq("tenant_id", t.tenantId)
      .single();

    if (warehouseError || !warehouse) {
      console.error("Error fetching warehouse:", warehouseError);
      return NextResponse.json({ error: "Failed to fetch warehouse data" }, { status: 500 });
    }

    const totalItems = Math.floor(Math.random() * 5000) + 3000;
    const utilization = warehouse.capacity
      ? Math.round((totalItems / warehouse.capacity) * 100)
      : 70;

    let warehouseOperations: unknown[] = [];
    try {
      const { data, error } = await supabase
        .from("warehouse_operations")
        .select("id, type, location, zone_id, operator, items, status, start_time")
        .eq("warehouse_id", warehouseId)
        .eq("tenant_id", t.tenantId)
        .order("start_time", { ascending: false })
        .limit(10);

      if (data && !error) {
        warehouseOperations = data;
      }
    } catch (error) {
      console.error("Error fetching operations:", error);
    }

    let warehouseZones: unknown[] = [];
    try {
      const { data, error } = await supabase
        .from("warehouse_zones")
        .select("id, name, code, color, x_position, y_position, width, height, capacity")
        .eq("warehouse_id", warehouseId)
        .eq("tenant_id", t.tenantId);

      if (data && !error) {
        warehouseZones = data;
      }
    } catch (error) {
      console.error("Error fetching zones:", error);
    }

    if (warehouseZones.length === 0) {
      const defaultZones = [
        { id: "1", name: "Receiving", color: "#4264D0", utilization: 65, items: 1250 },
        { id: "2", name: "Storage A", color: "#32A8CD", utilization: 78, items: 1870 },
        { id: "3", name: "Storage B", color: "#00C49F", utilization: 45, items: 980 },
        { id: "4", name: "Storage C", color: "#FCAE53", utilization: 92, items: 2100 },
        { id: "5", name: "Picking", color: "#F17171", utilization: 71, items: 620 },
        { id: "6", name: "Shipping", color: "#B558F6", utilization: 58, items: 480 },
      ];
      warehouseZones = defaultZones.map((zone) => ({
        id: zone.id,
        name: zone.name,
        code: zone.id,
        color: zone.color,
        x_position: Math.floor(Math.random() * 400) + 50,
        y_position: Math.floor(Math.random() * 300) + 50,
        width: 120,
        height: 120,
        capacity: Math.floor(Math.random() * 2000) + 500,
      }));
    }

    let activityData: unknown[] = [];
    try {
      const { data, error } = await supabase
        .from("warehouse_activity")
        .select("x_coordinate, y_coordinate, activity_level")
        .eq("warehouse_id", warehouseId)
        .eq("tenant_id", t.tenantId)
        .order("recorded_at", { ascending: false });

      if (data && !error) {
        activityData = data;
      }
    } catch (error) {
      console.error("Error fetching activity data:", error);
    }

    if (warehouseOperations.length === 0) {
      const operationTypes = ["Picking", "Restocking", "Inventory", "Shipping", "Receiving"];
      const statuses = ["Pending", "In Progress", "Completed"];
      const operators = ["John D.", "Sarah M.", "Mike T.", "Lisa R.", "Carlos S.", "Emma P.", "Alex K."];

      const numOperations = Math.floor(Math.random() * 6) + 5;
      for (let i = 0; i < numOperations; i++) {
        const type = operationTypes[Math.floor(Math.random() * operationTypes.length)];
        const status = statuses[Math.floor(Math.random() * statuses.length)];
        const operator = operators[Math.floor(Math.random() * operators.length)];
        const items = Math.floor(Math.random() * 45) + 5;
        const startTime = new Date(Date.now() - Math.floor(Math.random() * 3600000));

        warehouseOperations.push({
          id: `sample-op-${i}`,
          type,
          location: `Zone ${String.fromCharCode(65 + (i % 6))}`,
          zone_id: (i % 6) + 1,
          operator,
          items,
          status,
          start_time: startTime.toISOString(),
        });
      }
    }

    const activeOperations = (warehouseOperations as Record<string, unknown>[]).map((op) => ({
      id: op.id,
      type: op.type,
      location: op.location,
      zoneId: op.zone_id,
      operator: op.operator,
      items: op.items,
      status: op.status,
      startTime: formatTime(String(op.start_time)),
    }));

    const zones =
      (warehouseZones as Record<string, unknown>[]).map((zone: Record<string, unknown>, index: number) => {
        const zoneItems = Math.round(totalItems / (warehouseZones.length || 1));
        const zoneUtilization = Math.min(95, Math.max(30, utilization + ((index % 3) * 5 - 5)));

        return {
          id: zone.id,
          name: zone.name,
          color: zone.color,
          utilization: zoneUtilization,
          items: zoneItems,
          activity: countOperationsInZone(activeOperations, String(zone.id)),
        };
      }) || [];

    const heatmapData = processActivityData(activityData as { x_coordinate?: number; y_coordinate?: number; activity_level?: number }[]);

    let floorPlan = null;
    try {
      const { data } = await supabase
        .from("warehouse_floor_plans")
        .select("id, name, file_path")
        .eq("warehouse_id", warehouseId)
        .eq("tenant_id", t.tenantId)
        .eq("is_active", true)
        .order("uploaded_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (data) {
        floorPlan = data;
      }
    } catch (error) {
      console.error("Error fetching floor plan:", error);
    }

    return NextResponse.json({
      name: warehouse.name,
      utilization,
      items: totalItems,
      area: warehouse.capacity || 15000,
      capacity: warehouse.capacity,
      lastUpdate: new Date().toLocaleTimeString(),
      zones,
      heatmapData,
      activeOperations,
      floorPlan: floorPlan || null,
    });
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 });
  }
}

function formatTime(timestamp: string): string {
  return new Date(timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function processActivityData(
  activityData: { x_coordinate?: number; y_coordinate?: number; activity_level?: number }[]
): number[][] {
  const grid = Array(6)
    .fill(0)
    .map(() => Array(7).fill(0));

  if (activityData && activityData.length > 0) {
    activityData.forEach((point) => {
      const x = point.x_coordinate;
      const y = point.y_coordinate;

      if (x != null && y != null && x >= 0 && x < 7 && y >= 0 && y < 6) {
        grid[y][x] = point.activity_level ?? 0;
      }
    });
  } else {
    for (let y = 0; y < 6; y++) {
      for (let x = 0; x < 7; x++) {
        const distFromCenter = Math.sqrt((x - 3) ** 2 + (y - 2.5) ** 2);
        const normalizedDist = 1 - distFromCenter / Math.sqrt(13);
        grid[y][x] = Math.max(0.1, Math.min(0.9, normalizedDist * 0.5));
      }
    }
  }

  return grid;
}

function countOperationsInZone(operations: { zoneId?: unknown }[], zoneId: string): number {
  return operations.filter((op) => String(op.zoneId) === zoneId).length || Math.floor(Math.random() * 10) + 1;
}
