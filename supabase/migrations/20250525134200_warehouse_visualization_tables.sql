-- Create warehouse zones table
CREATE TABLE IF NOT EXISTS warehouse_zones (
  id SERIAL PRIMARY KEY,
  warehouse_id INTEGER NOT NULL REFERENCES warehouses(id),
  name VARCHAR(255) NOT NULL,
  color VARCHAR(50),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create warehouse operations table
CREATE TABLE IF NOT EXISTS warehouse_operations (
  id SERIAL PRIMARY KEY,
  warehouse_id INTEGER NOT NULL REFERENCES warehouses(id),
  zone_id INTEGER REFERENCES warehouse_zones(id),
  type VARCHAR(50) NOT NULL, -- Picking, Restocking, Inventory, Shipping, Receiving
  location VARCHAR(50), -- Grid reference like A1, B2, etc.
  operator VARCHAR(100), -- Person performing the operation
  items INTEGER NOT NULL DEFAULT 0, -- Number of items in operation
  status VARCHAR(20) NOT NULL, -- Pending, In Progress, Completed
  start_time TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  end_time TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create warehouse activity table (for heatmap)
CREATE TABLE IF NOT EXISTS warehouse_activity (
  id SERIAL PRIMARY KEY,
  warehouse_id INTEGER NOT NULL REFERENCES warehouses(id),
  x_coordinate INTEGER NOT NULL, -- X position in the grid
  y_coordinate INTEGER NOT NULL, -- Y position in the grid
  activity_level NUMERIC(3,2) NOT NULL, -- Activity level from 0.00 to 1.00
  recorded_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create warehouse floor plans table
CREATE TABLE IF NOT EXISTS warehouse_floor_plans (
  id SERIAL PRIMARY KEY,
  warehouse_id INTEGER NOT NULL REFERENCES warehouses(id),
  file_path VARCHAR(255) NOT NULL,
  file_name VARCHAR(255) NOT NULL,
  file_size INTEGER NOT NULL,
  file_type VARCHAR(50) NOT NULL,
  uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (warehouse_id)
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_warehouse_zones_warehouse_id ON warehouse_zones(warehouse_id);
CREATE INDEX IF NOT EXISTS idx_warehouse_operations_warehouse_id ON warehouse_operations(warehouse_id);
CREATE INDEX IF NOT EXISTS idx_warehouse_operations_zone_id ON warehouse_operations(zone_id);
CREATE INDEX IF NOT EXISTS idx_warehouse_operations_status ON warehouse_operations(status);
CREATE INDEX IF NOT EXISTS idx_warehouse_activity_warehouse_id ON warehouse_activity(warehouse_id);
CREATE INDEX IF NOT EXISTS idx_warehouse_activity_coordinates ON warehouse_activity(warehouse_id, x_coordinate, y_coordinate);

-- Insert sample data for warehouse zones
INSERT INTO warehouse_zones (warehouse_id, name, color)
VALUES 
  (1, 'Receiving', '#4264D0'),
  (1, 'Storage A', '#32A8CD'),
  (1, 'Storage B', '#00C49F'),
  (1, 'Storage C', '#FCAE53'),
  (1, 'Picking', '#F17171'),
  (1, 'Shipping', '#B558F6')
ON CONFLICT DO NOTHING;

-- Insert sample data for warehouse operations
INSERT INTO warehouse_operations (warehouse_id, zone_id, type, location, operator, items, status, start_time)
VALUES 
  (1, 1, 'Receiving', 'A1', 'John D.', 33, 'Completed', NOW() - INTERVAL '2 hours'),
  (1, 5, 'Picking', 'B2', 'Sarah M.', 12, 'In Progress', NOW() - INTERVAL '45 minutes'),
  (1, 3, 'Inventory', 'C1', 'Mike T.', 45, 'Completed', NOW() - INTERVAL '3 hours'),
  (1, 6, 'Shipping', 'D4', 'Lisa R.', 10, 'Pending', NOW() - INTERVAL '15 minutes'),
  (1, 2, 'Restocking', 'B1', 'Carlos S.', 28, 'In Progress', NOW() - INTERVAL '1 hour'),
  (1, 4, 'Inventory', 'C2', 'Alex K.', 15, 'Completed', NOW() - INTERVAL '4 hours'),
  (1, 5, 'Picking', 'B3', 'Emma P.', 22, 'Pending', NOW() - INTERVAL '30 minutes'),
  (1, 1, 'Receiving', 'A2', 'John D.', 18, 'In Progress', NOW() - INTERVAL '1.5 hours')
ON CONFLICT DO NOTHING;

-- Insert sample heatmap data
DO $$
DECLARE
  x INTEGER;
  y INTEGER;
BEGIN
  FOR y IN 0..5 LOOP
    FOR x IN 0..6 LOOP
      -- Create a realistic heatmap with more activity in the center
      INSERT INTO warehouse_activity (warehouse_id, x_coordinate, y_coordinate, activity_level)
      VALUES (
        1, 
        x, 
        y, 
        LEAST(1.0, GREATEST(0.1, 
          (1 - SQRT(POWER((x - 3), 2) + POWER((y - 2.5), 2)) / SQRT(13)) * 0.7 + RANDOM() * 0.3
        ))
      );
    END LOOP;
  END LOOP;
END $$;
