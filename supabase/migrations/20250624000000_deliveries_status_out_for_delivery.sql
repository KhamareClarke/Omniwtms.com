-- Allow status 'out_for_delivery' on deliveries (Organization can set "Out for Delivery" separately from "In Progress").
-- If your deliveries.status column has an existing CHECK, drop it first in SQL Editor, then run the ADD below.
ALTER TABLE deliveries DROP CONSTRAINT IF EXISTS deliveries_status_check;
ALTER TABLE deliveries ADD CONSTRAINT deliveries_status_check
  CHECK (status IN ('pending', 'in_progress', 'out_for_delivery', 'completed', 'failed'));
