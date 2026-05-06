-- Warehouse Floor Plan to Inventory Grid Tables

-- Drop existing tables in reverse order if they exist (to handle foreign key constraints)
DROP TABLE IF EXISTS section_inventory CASCADE;
DROP TABLE IF EXISTS warehouse_sections CASCADE;
DROP TABLE IF EXISTS warehouse_layouts CASCADE;

-- Create warehouse_layouts table
CREATE TABLE warehouse_layouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  warehouse_id UUID NOT NULL REFERENCES warehouses(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  image_width INTEGER,
  image_height INTEGER,
  grid_rows INTEGER NOT NULL DEFAULT 10,
  grid_columns INTEGER NOT NULL DEFAULT 10,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

CREATE INDEX idx_warehouse_layouts_warehouse_id ON warehouse_layouts(warehouse_id);

-- Create warehouse_sections table
CREATE TABLE warehouse_sections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  layout_id UUID NOT NULL REFERENCES warehouse_layouts(id) ON DELETE CASCADE,
  row_index INTEGER NOT NULL,
  column_index INTEGER NOT NULL,
  section_name TEXT NOT NULL,
  section_type TEXT NOT NULL CHECK (section_type IN ('storage', 'shipping', 'receiving', 'picking', 'blocked', 'other')),
  capacity INTEGER NOT NULL DEFAULT 0,
  current_usage INTEGER NOT NULL DEFAULT 0,
  is_blocked BOOLEAN NOT NULL DEFAULT false,
  color TEXT, -- For custom color override
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(layout_id, row_index, column_index)
);

CREATE INDEX idx_warehouse_sections_layout_id ON warehouse_sections(layout_id);
CREATE INDEX idx_warehouse_sections_position ON warehouse_sections(layout_id, row_index, column_index);

-- Create section_inventory table
CREATE TABLE section_inventory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  section_id UUID NOT NULL REFERENCES warehouse_sections(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE SET NULL,
  quantity INTEGER NOT NULL DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE INDEX idx_section_inventory_section_id ON section_inventory(section_id);
CREATE INDEX idx_section_inventory_product_id ON section_inventory(product_id);

-- Function to calculate section usage percentage
CREATE OR REPLACE FUNCTION calculate_section_usage(section_uuid UUID)
RETURNS NUMERIC AS $$
DECLARE
  section_capacity INTEGER;
  section_current INTEGER;
  usage_percentage NUMERIC;
BEGIN
  SELECT capacity, current_usage INTO section_capacity, section_current
  FROM warehouse_sections
  WHERE id = section_uuid;
  
  IF section_capacity = 0 THEN
    RETURN 0;
  END IF;
  
  usage_percentage := (section_current::NUMERIC / section_capacity::NUMERIC) * 100;
  RETURN usage_percentage;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update section current_usage when inventory changes
CREATE OR REPLACE FUNCTION update_section_usage()
RETURNS TRIGGER AS $$
DECLARE
  target_section_id UUID;
BEGIN
  -- Determine which section_id to update
  IF TG_OP = 'DELETE' THEN
    target_section_id := OLD.section_id;
  ELSE
    target_section_id := NEW.section_id;
  END IF;

  -- Update the section's current_usage
  UPDATE warehouse_sections
  SET current_usage = (
    SELECT COALESCE(SUM(quantity), 0)
    FROM section_inventory
    WHERE section_id = target_section_id
  ),
  updated_at = now()
  WHERE id = target_section_id;
  
  -- Return appropriate record based on operation
  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Drop trigger if it exists
DROP TRIGGER IF EXISTS trigger_update_section_usage ON section_inventory;

CREATE TRIGGER trigger_update_section_usage
AFTER INSERT OR UPDATE OR DELETE ON section_inventory
FOR EACH ROW
EXECUTE FUNCTION update_section_usage();

