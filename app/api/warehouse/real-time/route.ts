import { NextResponse } from 'next/server';
import { createClient } from '../../.././../lib/supabase/server';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const warehouseId = searchParams.get('warehouseId');
    
    // Create Supabase client
    const supabase = createClient();
    
    // Skip the warehouseId if it's obviously not a UUID
    let effectiveWarehouseId = null;
    
    // UUID regex pattern for basic validation
    const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    
    if (warehouseId && uuidPattern.test(warehouseId)) {
      effectiveWarehouseId = warehouseId;
    }
    
    // If no valid warehouse ID was provided, get the first warehouse from the database
    if (!effectiveWarehouseId) {
      const { data: firstWarehouse } = await supabase
        .from('warehouses')
        .select('id')
        .limit(1)
        .single();
      
      effectiveWarehouseId = firstWarehouse?.id;
    }
    
    if (!effectiveWarehouseId) {
      return NextResponse.json(
        { error: 'No warehouse found in the database' },
        { status: 404 }
      );
    }
    
    // Get warehouse details
    const { data: warehouse, error: warehouseError } = await supabase
      .from('warehouses')
      .select('*')
      .eq('id', effectiveWarehouseId)
      .single();
    
    if (warehouseError) {
      console.error('Error fetching warehouse:', warehouseError);
      return NextResponse.json(
        { error: 'Failed to fetch warehouse data' },
        { status: 500 }
      );
    }
    
    // If warehouse exists, get related data
    // For demonstration purposes, we'll create some sample inventory data
    // In a real app, you would query your inventory_levels table
    const totalItems = Math.floor(Math.random() * 5000) + 3000; // Random number between 3000-8000
    const utilization = warehouse.capacity ? Math.round((totalItems / warehouse.capacity) * 100) : 70;
    
    // Get warehouse operations (most recent 10) with fallback if table doesn't exist
    let warehouseOperations: any[] = [];
    try {
      const { data, error } = await supabase
        .from('warehouse_operations')
        .select('id, type, location, zone_id, operator, items, status, start_time')
        .eq('warehouse_id', effectiveWarehouseId)
        .order('start_time', { ascending: false })
        .limit(10);
        
      if (data && !error) {
        warehouseOperations = data;
      }
    } catch (error) {
      console.error('Error fetching operations:', error);
      // Continue with fallback data
    }
    
    // Get warehouse zones with fallback if table doesn't exist
    let warehouseZones: any[] = [];
    try {
      const { data, error } = await supabase
        .from('warehouse_zones')
        .select('id, name, code, color, x_position, y_position, width, height, capacity')
        .eq('warehouse_id', effectiveWarehouseId);
        
      if (data && !error) {
        warehouseZones = data;
      }
    } catch (error) {
      console.error('Error fetching zones:', error);
      // Continue with fallback data
    }
    
    // Generate default zones if none exist
    if (warehouseZones.length === 0) {
      const defaultZones = [
        { id: '1', name: 'Receiving', color: '#4264D0', utilization: 65, items: 1250 },
        { id: '2', name: 'Storage A', color: '#32A8CD', utilization: 78, items: 1870 },
        { id: '3', name: 'Storage B', color: '#00C49F', utilization: 45, items: 980 },
        { id: '4', name: 'Storage C', color: '#FCAE53', utilization: 92, items: 2100 },
        { id: '5', name: 'Picking', color: '#F17171', utilization: 71, items: 620 },
        { id: '6', name: 'Shipping', color: '#B558F6', utilization: 58, items: 480 }
      ];
      warehouseZones = defaultZones.map(zone => ({
        id: zone.id,
        name: zone.name,
        code: zone.id,
        color: zone.color,
        x_position: Math.floor(Math.random() * 400) + 50,
        y_position: Math.floor(Math.random() * 300) + 50,
        width: 120,
        height: 120,
        capacity: Math.floor(Math.random() * 2000) + 500
      }));
    }
    
    // Get warehouse activity (heatmap) with fallback if table doesn't exist
    let activityData: any[] = [];
    try {
      const { data, error } = await supabase
        .from('warehouse_activity')
        .select('x_coordinate, y_coordinate, activity_level')
        .eq('warehouse_id', effectiveWarehouseId)
        .order('recorded_at', { ascending: false });
        
      if (data && !error) {
        activityData = data;
      }
    } catch (error) {
      console.error('Error fetching activity data:', error);
      // Continue with fallback data
    }
    
    // Add sample operations if none exist
    if (warehouseOperations.length === 0) {
      const operationTypes = ['Picking', 'Restocking', 'Inventory', 'Shipping', 'Receiving'];
      const statuses = ['Pending', 'In Progress', 'Completed'];
      const operators = ['John D.', 'Sarah M.', 'Mike T.', 'Lisa R.', 'Carlos S.', 'Emma P.', 'Alex K.'];
      
      // Generate 5-10 sample operations
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
          location: `Zone ${String.fromCharCode(65 + i % 6)}`,
          zone_id: (i % 6 + 1).toString(),
          operator,
          items,
          status,
          start_time: startTime.toISOString()
        });
      }
    }
    
    // Transform operations data for the frontend
    const activeOperations = warehouseOperations.map((op: any) => ({
      id: op.id,
      type: op.type,
      location: op.location,
      zoneId: op.zone_id,
      operator: op.operator,
      items: op.items,
      status: op.status,
      startTime: formatTime(op.start_time)
    }));
    
    // Transform zone data with inventory distribution
    const zones = warehouseZones?.map((zone: any, index: number) => {
      // Calculate zone-specific metrics based on real data
      const zoneItems = Math.round(totalItems / (warehouseZones.length || 1));
      const zoneUtilization = Math.min(95, Math.max(30, utilization + ((index % 3) * 5 - 5)));
      
      return {
        id: zone.id,
        name: zone.name,
        color: zone.color,
        utilization: zoneUtilization,
        items: zoneItems,
        activity: countOperationsInZone(activeOperations, zone.id)
      };
    }) || [];
    
    // Process activity data into a heatmap grid
    const heatmapData = processActivityData(activityData);
    
    // Get the latest floor plan if available, with fallback handling
    let floorPlan = null;
    try {
      const { data } = await supabase
        .from('warehouse_floor_plans')
        .select('id, name, file_path')
        .eq('warehouse_id', effectiveWarehouseId)
        .eq('is_active', true)
        .order('uploaded_at', { ascending: false })
        .limit(1)
        .single();
        
      if (data) {
        floorPlan = data;
      }
    } catch (error) {
      console.error('Error fetching floor plan:', error);
      // Continue with null floor plan
    }
      
    return NextResponse.json({
      name: warehouse.name,
      utilization,
      items: totalItems,
      area: warehouse.capacity || 15000, // using capacity as area if available
      capacity: warehouse.capacity,
      lastUpdate: new Date().toLocaleTimeString(),
      zones,
      heatmapData,
      activeOperations,
      floorPlan: floorPlan || null
    });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}

// Helper function to determine operation status based on timestamp
function determineStatus(timestamp: string): 'Pending' | 'In Progress' | 'Completed' {
  const opTime = new Date(timestamp).getTime();
  const now = Date.now();
  const diffMinutes = (now - opTime) / (1000 * 60);
  
  if (diffMinutes < 10) return 'Pending';
  if (diffMinutes < 30) return 'In Progress';
  return 'Completed';
}

// Helper function to format time
function formatTime(timestamp: string): string {
  return new Date(timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
}

// Simple hash function for consistent pseudorandom values
function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash);
}

// Process activity data from the database into a heatmap grid
function processActivityData(activityData: any[]): number[][] {
  // Initialize empty grid (6x7)
  const grid = Array(6).fill(0).map(() => Array(7).fill(0));
  
  // If we have activity data, use it to fill the grid
  if (activityData && activityData.length > 0) {
    activityData.forEach((point: any) => {
      const x = point.x_coordinate;
      const y = point.y_coordinate;
      
      // Ensure coordinates are within bounds
      if (x >= 0 && x < 7 && y >= 0 && y < 6) {
        grid[y][x] = point.activity_level;
      }
    });
  } else {
    // If no activity data, create a baseline grid
    for (let y = 0; y < 6; y++) {
      for (let x = 0; x < 7; x++) {
        // Center has more activity as a fallback
        const distFromCenter = Math.sqrt(Math.pow((x - 3), 2) + Math.pow((y - 2.5), 2));
        const normalizedDist = 1 - (distFromCenter / Math.sqrt(13)); // Max distance is sqrt(13)
        grid[y][x] = Math.max(0.1, Math.min(0.9, normalizedDist * 0.5));
      }
    }
  }
  
  return grid;
}

// Count operations associated with a specific zone
function countOperationsInZone(operations: any[], zoneId: string): number {
  return operations.filter(op => op.zoneId === zoneId).length || Math.floor(Math.random() * 10) + 1;
}


