-- Ensure warehouse_inventory and inventory_movements exist (required by dashboard, warehouses content, reports).
-- Run on production Supabase (e.g. SQL Editor or supabase db push) so 404s for these tables are resolved.

-- warehouse_inventory: links warehouses + products with quantity and client
CREATE TABLE IF NOT EXISTS public.warehouse_inventory (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  warehouse_id uuid NOT NULL REFERENCES public.warehouses(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  quantity integer NOT NULL DEFAULT 0,
  status text DEFAULT 'assigned',
  assigned_at timestamptz,
  client_id uuid,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_warehouse_inventory_warehouse_id ON public.warehouse_inventory(warehouse_id);
CREATE INDEX IF NOT EXISTS idx_warehouse_inventory_product_id ON public.warehouse_inventory(product_id);
CREATE INDEX IF NOT EXISTS idx_warehouse_inventory_client_id ON public.warehouse_inventory(client_id);

ALTER TABLE public.warehouse_inventory ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow read warehouse_inventory" ON public.warehouse_inventory;
CREATE POLICY "Allow read warehouse_inventory" ON public.warehouse_inventory FOR SELECT USING (true);
DROP POLICY IF EXISTS "Allow insert warehouse_inventory" ON public.warehouse_inventory;
CREATE POLICY "Allow insert warehouse_inventory" ON public.warehouse_inventory FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Allow update warehouse_inventory" ON public.warehouse_inventory;
CREATE POLICY "Allow update warehouse_inventory" ON public.warehouse_inventory FOR UPDATE USING (true);
DROP POLICY IF EXISTS "Allow delete warehouse_inventory" ON public.warehouse_inventory;
CREATE POLICY "Allow delete warehouse_inventory" ON public.warehouse_inventory FOR DELETE USING (true);

-- inventory_movements: audit log for stock in/out
CREATE TABLE IF NOT EXISTS public.inventory_movements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  warehouse_id uuid REFERENCES public.warehouses(id) ON DELETE SET NULL,
  product_id uuid REFERENCES public.products(id) ON DELETE SET NULL,
  quantity integer NOT NULL,
  movement_type text NOT NULL,
  reference_number text,
  notes text,
  performed_by text,
  timestamp timestamptz DEFAULT now(),
  client_id uuid,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_inventory_movements_client_id ON public.inventory_movements(client_id);
CREATE INDEX IF NOT EXISTS idx_inventory_movements_timestamp ON public.inventory_movements(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_inventory_movements_warehouse_id ON public.inventory_movements(warehouse_id);

ALTER TABLE public.inventory_movements ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow read inventory_movements" ON public.inventory_movements;
CREATE POLICY "Allow read inventory_movements" ON public.inventory_movements FOR SELECT USING (true);
DROP POLICY IF EXISTS "Allow insert inventory_movements" ON public.inventory_movements;
CREATE POLICY "Allow insert inventory_movements" ON public.inventory_movements FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Allow update inventory_movements" ON public.inventory_movements;
CREATE POLICY "Allow update inventory_movements" ON public.inventory_movements FOR UPDATE USING (true);
DROP POLICY IF EXISTS "Allow delete inventory_movements" ON public.inventory_movements;
CREATE POLICY "Allow delete inventory_movements" ON public.inventory_movements FOR DELETE USING (true);

COMMENT ON TABLE public.warehouse_inventory IS 'Warehouse product stock; required by dashboard and warehouses page.';
COMMENT ON TABLE public.inventory_movements IS 'Stock movement log; required by dashboard and reports.';
