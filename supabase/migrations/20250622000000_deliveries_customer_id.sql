-- Add customer_id to deliveries so customer dashboard and live tracking can show deliveries per customer.
-- When delivery type is "Warehouse to Customer Address", organization assigns to a customer; this links that delivery to the customer.

ALTER TABLE deliveries
ADD COLUMN IF NOT EXISTS customer_id uuid REFERENCES customers(id);

COMMENT ON COLUMN deliveries.customer_id IS 'Set when delivery is to a customer address; links to customers.id for customer portal and live tracking.';
