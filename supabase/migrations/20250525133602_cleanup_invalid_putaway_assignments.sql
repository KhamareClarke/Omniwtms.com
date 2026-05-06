-- Delete any putaway assignments that reference non-existent truck items
DELETE FROM putaway_assignments
WHERE truck_item_id NOT IN (SELECT id FROM truck_items);

-- Add a trigger to ensure truck_items are created before putaway assignments
CREATE OR REPLACE FUNCTION check_truck_item_exists()
RETURNS TRIGGER AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM truck_items WHERE id = NEW.truck_item_id) THEN
    RAISE EXCEPTION 'Cannot create putaway assignment: truck_item_id % does not exist', NEW.truck_item_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create the trigger
DROP TRIGGER IF EXISTS ensure_truck_item_exists ON putaway_assignments;
CREATE TRIGGER ensure_truck_item_exists
BEFORE INSERT OR UPDATE ON putaway_assignments
FOR EACH ROW
EXECUTE FUNCTION check_truck_item_exists(); 