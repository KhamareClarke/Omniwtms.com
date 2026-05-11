-- Phase 15: Hazmat compliance
-- Phase 16: Supplier portal + purchase orders

-- SKU hazmat metadata
ALTER TABLE public.skus ADD COLUMN IF NOT EXISTS hazmat_class text;
ALTER TABLE public.skus ADD COLUMN IF NOT EXISTS hazmat_packing_group text;
ALTER TABLE public.skus ADD COLUMN IF NOT EXISTS hazmat_proper_shipping_name text;
ALTER TABLE public.skus ADD COLUMN IF NOT EXISTS is_forbidden_air boolean NOT NULL DEFAULT false;
ALTER TABLE public.skus ADD COLUMN IF NOT EXISTS is_forbidden_sea boolean NOT NULL DEFAULT false;
ALTER TABLE public.skus ADD COLUMN IF NOT EXISTS reorder_point integer;

-- SDS library (metadata; files should be stored in Supabase Storage)
CREATE TABLE IF NOT EXISTS public.sds_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  sku_id uuid REFERENCES public.skus(id) ON DELETE SET NULL,
  title text NOT NULL,
  storage_path text NOT NULL,
  uploaded_by text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_sds_documents_tenant ON public.sds_documents(tenant_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_sds_documents_sku ON public.sds_documents(sku_id);

-- Hazmat shipment audit log
CREATE TABLE IF NOT EXISTS public.hazmat_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  order_id uuid REFERENCES public.orders(id) ON DELETE SET NULL,
  delivery_id uuid REFERENCES public.deliveries(id) ON DELETE SET NULL,
  action text NOT NULL,
  actor text,
  metadata jsonb NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_hazmat_audit_tenant_created ON public.hazmat_audit_log(tenant_id, created_at DESC);

-- Suppliers
CREATE TABLE IF NOT EXISTS public.suppliers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  name text NOT NULL,
  contact_email text,
  address text,
  phone text,
  lead_time_days integer NOT NULL DEFAULT 7,
  min_order_qty integer NOT NULL DEFAULT 1,
  quality_rating numeric(5,2),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_suppliers_tenant ON public.suppliers(tenant_id, created_at DESC);

-- Purchase orders
CREATE TABLE IF NOT EXISTS public.purchase_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  supplier_id uuid NOT NULL REFERENCES public.suppliers(id) ON DELETE CASCADE,
  po_number text NOT NULL,
  status text NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft','sent','acknowledged','in_transit','delivered','cancelled')),
  order_date date NOT NULL DEFAULT CURRENT_DATE,
  delivery_date date,
  total_amount numeric(12,2) NOT NULL DEFAULT 0,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT purchase_orders_po_unique_per_tenant UNIQUE (tenant_id, po_number)
);
CREATE INDEX IF NOT EXISTS idx_purchase_orders_tenant ON public.purchase_orders(tenant_id, order_date DESC);
CREATE INDEX IF NOT EXISTS idx_purchase_orders_supplier ON public.purchase_orders(supplier_id, order_date DESC);

-- PO items
CREATE TABLE IF NOT EXISTS public.po_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  po_id uuid NOT NULL REFERENCES public.purchase_orders(id) ON DELETE CASCADE,
  sku_id uuid NOT NULL REFERENCES public.skus(id) ON DELETE RESTRICT,
  quantity integer NOT NULL CHECK (quantity > 0),
  unit_price numeric(12,2) NOT NULL DEFAULT 0,
  total numeric(12,2) NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS idx_po_items_po ON public.po_items(po_id);
CREATE INDEX IF NOT EXISTS idx_po_items_sku ON public.po_items(sku_id);

-- Optional supplier portal access table (simple password-hash auth per tenant supplier)
CREATE TABLE IF NOT EXISTS public.supplier_portal_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  supplier_id uuid NOT NULL REFERENCES public.suppliers(id) ON DELETE CASCADE,
  email text NOT NULL,
  password_hash text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  last_login_at timestamptz
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_supplier_portal_user_unique ON public.supplier_portal_users(tenant_id, email);

COMMENT ON TABLE public.sds_documents IS 'SDS metadata records; documents stored in storage bucket.';
COMMENT ON TABLE public.hazmat_audit_log IS 'Hazmat compliance events: checks, declarations, courier warnings.';
COMMENT ON TABLE public.suppliers IS 'Supplier directory per tenant.';
COMMENT ON TABLE public.purchase_orders IS 'Purchase order headers per supplier.';
COMMENT ON TABLE public.po_items IS 'Purchase order line items.';
