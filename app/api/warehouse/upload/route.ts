import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { writeFile } from 'fs/promises';
import { join } from 'path';
import { v4 as uuidv4 } from 'uuid';

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const warehouseId = formData.get('warehouseId') as string;
    const name = formData.get('name') as string || 'Warehouse Floor Plan';
    const description = formData.get('description') as string || 'Uploaded floor plan';
    
    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }
    
    // Validate file type
    if (!file.type.includes('image/png')) {
      return NextResponse.json(
        { error: 'Only PNG files are allowed' },
        { status: 400 }
      );
    }
    
    // Create Supabase client
    const supabase = createClient();
    
    // Get first warehouse if none specified
    let effectiveWarehouseId = null;
    
    // UUID regex pattern for basic validation
    const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    
    if (warehouseId && uuidPattern.test(warehouseId)) {
      effectiveWarehouseId = warehouseId;
    }
    
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
    
    // Save file to public directory
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    
    // Create a unique filename
    const uniqueId = uuidv4();
    const filename = `floorplan-${uniqueId}.png`;
    const publicDir = join(process.cwd(), 'public', 'uploads');
    const filePath = join(publicDir, filename);
    
    try {
      // Ensure uploads directory exists
      await writeFile(filePath, buffer);
      
      // Store in Supabase
      const fileUrl = `/uploads/${filename}`;
      
      // Deactivate all existing floor plans for this warehouse
      await supabase
        .from('warehouse_floor_plans')
        .update({ is_active: false })
        .eq('warehouse_id', effectiveWarehouseId);
      
      // Insert new floor plan
      const { data: floorPlan, error } = await supabase
        .from('warehouse_floor_plans')
        .insert({
          warehouse_id: effectiveWarehouseId,
          name,
          description,
          file_path: fileUrl,
          is_active: true,
          uploaded_by: 'admin',
          uploaded_at: new Date().toISOString()
        })
        .select()
        .single();
      
      if (error) {
        console.error('Error saving floor plan to database:', error);
        return NextResponse.json(
          { error: 'Failed to save floor plan to database' },
          { status: 500 }
        );
      }
      
      return NextResponse.json({
        success: true,
        message: 'Floor plan uploaded successfully',
        floorPlan
      });
    } catch (error) {
      console.error('Error saving file:', error);
      return NextResponse.json(
        { error: 'Failed to save file' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}
