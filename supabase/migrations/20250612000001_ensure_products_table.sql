-- Ensure public.products exists so "Failed to load products" / "Failed to fetch products" are resolved.
-- The app and warehouse floor plan (section_inventory) reference this table.

CREATE TABLE IF NOT EXISTS public.products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid,
  name text NOT NULL,
  sku text,
  barcode text,
  price numeric DEFAULT 0,
  quantity integer DEFAULT 0,
  category text,
  condition text DEFAULT 'New',
  height numeric,
  weight numeric,
  length numeric,
  width numeric,
  dimensions text,
  description text,
  status text DEFAULT 'saved',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_products_client_id ON public.products(client_id);
CREATE INDEX IF NOT EXISTS idx_products_sku ON public.products(sku);
CREATE INDEX IF NOT EXISTS idx_products_created_at ON public.products(created_at);

ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow read products" ON public.products;
CREATE POLICY "Allow read products" ON public.products FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow insert products" ON public.products;
CREATE POLICY "Allow insert products" ON public.products FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Allow update products" ON public.products;
CREATE POLICY "Allow update products" ON public.products FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Allow delete products" ON public.products;
CREATE POLICY "Allow delete products" ON public.products FOR DELETE USING (true);

COMMENT ON TABLE public.products IS 'Products table required by dashboard, inventories, and warehouse operations.';
