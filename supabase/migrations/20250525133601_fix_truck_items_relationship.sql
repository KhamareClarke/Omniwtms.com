-- First, create the truck_items table if it doesn't exist
CREATE TABLE IF NOT EXISTS truck_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  truck_arrival_id UUID,
  description TEXT NOT NULL,
  quantity INTEGER NOT NULL,
  condition TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Drop the existing foreign key constraint if it exists
ALTER TABLE putaway_assignments
DROP CONSTRAINT IF EXISTS fk_putaway_assignments_truck_items;

-- Add the foreign key constraint with ON DELETE CASCADE
ALTER TABLE putaway_assignments
ADD CONSTRAINT fk_putaway_assignments_truck_items
FOREIGN KEY (truck_item_id)
REFERENCES truck_items(id)
ON DELETE CASCADE;

-- Create an index on truck_item_id for better performance
CREATE INDEX IF NOT EXISTS idx_putaway_assignments_truck_item_id 
ON putaway_assignments(truck_item_id);

-- Create an index on truck_arrival_id for better performance
CREATE INDEX IF NOT EXISTS idx_truck_items_truck_arrival_id 
ON truck_items(truck_arrival_id); 