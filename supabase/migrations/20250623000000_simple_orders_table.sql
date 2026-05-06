-- simple_orders: customer orders (one row per line item). Used by customer dashboard Orders page.
-- Customer creates orders via "Create Order"; organization can also associate orders to customers.

CREATE TABLE IF NOT EXISTS simple_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  description text,
  quantity integer NOT NULL DEFAULT 1 CHECK (quantity > 0),
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_simple_orders_customer_id ON simple_orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_simple_orders_created_at ON simple_orders(created_at DESC);

COMMENT ON TABLE simple_orders IS 'Customer order line items; customer_id links to customers table (organization-scoped).';