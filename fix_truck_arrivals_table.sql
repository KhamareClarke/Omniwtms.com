-- Add client_id column to truck_arrivals table
ALTER TABLE truck_arrivals 
ADD COLUMN IF NOT EXISTS client_id UUID;

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_truck_arrivals_client_id ON truck_arrivals(client_id);

-- Note: Making it NOT NULL after adding it, but first update any existing NULL values
-- If you have existing rows, you may want to set a default value first:
-- UPDATE truck_arrivals 
-- SET client_id = 'YOUR_DEFAULT_USER_ID_HERE'::uuid 
-- WHERE client_id IS NULL;

-- Then make it NOT NULL (uncomment when ready):
-- ALTER TABLE truck_arrivals 
-- ALTER COLUMN client_id SET NOT NULL;

