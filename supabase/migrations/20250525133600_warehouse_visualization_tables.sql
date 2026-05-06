-- Warehouse Visualization Tables

-- Create truck_items table if it doesn't exist
CREATE TABLE IF NOT EXISTS truck_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  truck_arrival_id UUID,
  description TEXT NOT NULL,
  quantity INTEGER NOT NULL,
  condition TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Table for warehouse zones
CREATE TABLE IF NOT EXISTS warehouse_zones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  warehouse_id UUID REFERENCES warehouses(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  code TEXT NOT NULL,
  color TEXT,
  x_position INTEGER,
  y_position INTEGER,
  width INTEGER,
  height INTEGER,
  capacity INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_warehouse_zones_warehouse_id ON warehouse_zones(warehouse_id);

-- Table for warehouse operations
CREATE TABLE IF NOT EXISTS warehouse_operations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL CHECK (type IN ('Picking', 'Restocking', 'Inventory', 'Shipping', 'Receiving')),
  warehouse_id UUID REFERENCES warehouses(id) ON DELETE CASCADE,
  zone_id UUID REFERENCES warehouse_zones(id) ON DELETE SET NULL,
  location TEXT,
  status TEXT NOT NULL CHECK (status IN ('Pending', 'In Progress', 'Completed', 'Cancelled')),
  operator TEXT,
  items INTEGER,
  start_time TIMESTAMP WITH TIME ZONE DEFAULT now(),
  end_time TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_warehouse_operations_warehouse_id ON warehouse_operations(warehouse_id);
CREATE INDEX IF NOT EXISTS idx_warehouse_operations_zone_id ON warehouse_operations(zone_id);
CREATE INDEX IF NOT EXISTS idx_warehouse_operations_status ON warehouse_operations(status);

-- Table for warehouse activity heatmap data
CREATE TABLE IF NOT EXISTS warehouse_activity (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  warehouse_id UUID REFERENCES warehouses(id) ON DELETE CASCADE,
  zone_id UUID REFERENCES warehouse_zones(id) ON DELETE CASCADE,
  x_coordinate INTEGER NOT NULL,
  y_coordinate INTEGER NOT NULL,
  activity_level DECIMAL NOT NULL,
  activity_type TEXT,
  recorded_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_warehouse_activity_warehouse_id ON warehouse_activity(warehouse_id);
CREATE INDEX IF NOT EXISTS idx_warehouse_activity_zone_id ON warehouse_activity(zone_id);
CREATE INDEX IF NOT EXISTS idx_warehouse_activity_recorded_at ON warehouse_activity(recorded_at);

-- Table for warehouse floor plans
CREATE TABLE IF NOT EXISTS warehouse_floor_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  warehouse_id UUID REFERENCES warehouses(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  file_path TEXT,
  is_active BOOLEAN DEFAULT false,
  uploaded_by TEXT,
  uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_warehouse_floor_plans_warehouse_id ON warehouse_floor_plans(warehouse_id);

-- Add triggers to update the updated_at column
CREATE OR REPLACE FUNCTION update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_warehouse_zones_timestamp
BEFORE UPDATE ON warehouse_zones
FOR EACH ROW EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER update_warehouse_operations_timestamp
BEFORE UPDATE ON warehouse_operations
FOR EACH ROW EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER update_warehouse_floor_plans_timestamp
BEFORE UPDATE ON warehouse_floor_plans
FOR EACH ROW EXECUTE FUNCTION update_timestamp();

-- Add some sample data for testing
INSERT INTO warehouse_zones (warehouse_id, name, code, color, x_position, y_position, width, height, capacity)
SELECT 
  w.id,
  unnest(ARRAY['Receiving', 'Storage A', 'Storage B', 'Storage C', 'Picking', 'Shipping']),
  unnest(ARRAY['A1', 'A2', 'A3', 'B1', 'B2', 'B3']),
  unnest(ARRAY['#4264D0', '#32A8CD', '#00C49F', '#FCAE53', '#F17171', '#B558F6']),
  unnest(ARRAY[70, 260, 450, 70, 260, 450]),
  unnest(ARRAY[70, 70, 70, 350, 350, 350]),
  180,
  180,
  unnest(ARRAY[1000, 1500, 1200, 900, 800, 700])
FROM warehouses w
LIMIT 1;

-- Insert sample operations
INSERT INTO warehouse_operations (type, warehouse_id, zone_id, location, status, operator, items, start_time, end_time)
SELECT
  unnest(ARRAY['Picking', 'Restocking', 'Inventory', 'Shipping', 'Receiving']),
  w.id,
  z.id,
  z.code,
  'Completed',
  unnest(ARRAY['John D.', 'Sarah M.', 'Mike T.', 'Lisa R.', 'Carlos S.']),
  unnest(ARRAY[12, 28, 45, 7, 32]),
  now() - interval '3 hours',
  now() - interval '2 hours'
FROM warehouses w
JOIN warehouse_zones z ON z.warehouse_id = w.id
LIMIT 5;

-- Insert more recent operations
INSERT INTO warehouse_operations (type, warehouse_id, zone_id, location, status, operator, items, start_time)
SELECT
  unnest(ARRAY['Picking', 'Restocking', 'Receiving']),
  w.id,
  z.id,
  z.code,
  'In Progress',
  unnest(ARRAY['Alex K.', 'Emma P.', 'John D.']),
  unnest(ARRAY[15, 22, 8]),
  now() - interval '30 minutes'
FROM warehouses w
JOIN warehouse_zones z ON z.warehouse_id = w.id
LIMIT 3;

-- Insert activity heatmap data
INSERT INTO warehouse_activity (warehouse_id, zone_id, x_coordinate, y_coordinate, activity_level, activity_type, recorded_at)
SELECT
  w.id,
  z.id,
  x,
  y,
  0.1 + random() * 0.9,
  unnest(ARRAY['movement', 'pickup', 'storage', 'transit', 'idle']),
  now() - (random() * interval '24 hours')
FROM
  warehouses w,
  warehouse_zones z,
  generate_series(0, 6) x,
  generate_series(0, 5) y
WHERE z.warehouse_id = w.id
LIMIT 200;

-- Drop existing foreign key constraint if it exists
ALTER TABLE putaway_assignments
DROP CONSTRAINT IF EXISTS fk_putaway_assignments_truck_items;

-- Add foreign key relationship between putaway_assignments and truck_items
ALTER TABLE putaway_assignments
ADD CONSTRAINT fk_putaway_assignments_truck_items
FOREIGN KEY (truck_item_id)
REFERENCES truck_items(id)
ON DELETE CASCADE;

-- Create index for the foreign key
CREATE INDEX IF NOT EXISTS idx_putaway_assignments_truck_item_id 
ON putaway_assignments(truck_item_id);
