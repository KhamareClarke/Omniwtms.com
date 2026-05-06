-- Allow admin to suspend customers (same pattern as clients/couriers)
ALTER TABLE customers
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active';

COMMENT ON COLUMN customers.status IS 'active | inactive (suspended by admin)';
