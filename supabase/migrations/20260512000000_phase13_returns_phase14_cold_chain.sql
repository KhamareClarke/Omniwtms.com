-- Phase 13: Returns / RMA
-- Phase 14: Cold chain temperature monitoring

-- Returns (RMA) — links to customers; order from main orders or simple_orders.
CREATE TABLE IF NOT EXISTS public.returns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants (id) ON DELETE CASCADE,
  order_id uuid REFERENCES public.orders (id) ON DELETE SET NULL,
  simple_order_id uuid REFERENCES public.simple_orders (id) ON DELETE SET NULL,
  customer_id uuid NOT NULL REFERENCES public.customers (id) ON DELETE CASCADE,
  reason text NOT NULL,
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN (
      'pending', 'approved', 'rejected', 'label_sent', 'in_transit',
      'received', 'inspecting', 'refunded', 'restocked', 'closed'
    )),
  rma_number text NOT NULL,
  rejection_note text,
  refund_reference text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT returns_one_order_source CHECK (
    (order_id IS NOT NULL) OR (simple_order_id IS NOT NULL)
  )
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_returns_rma_number ON public.returns (rma_number);
CREATE INDEX IF NOT EXISTS idx_returns_tenant_status ON public.returns (tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_returns_customer ON public.returns (customer_id);

CREATE TABLE IF NOT EXISTS public.return_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  return_id uuid NOT NULL REFERENCES public.returns (id) ON DELETE CASCADE,
  sku_id uuid REFERENCES public.skus (id) ON DELETE SET NULL,
  quantity integer NOT NULL CHECK (quantity > 0),
  condition text NOT NULL DEFAULT 'unknown'
    CHECK (condition IN ('unopened', 'opened', 'damaged', 'unknown')),
  inspection_notes text,
  restocked boolean NOT NULL DEFAULT false
);

CREATE INDEX IF NOT EXISTS idx_return_items_return ON public.return_items (return_id);

-- SKU cold-chain limits (°C)
ALTER TABLE public.skus ADD COLUMN IF NOT EXISTS temp_min_c numeric;
ALTER TABLE public.skus ADD COLUMN IF NOT EXISTS temp_max_c numeric;

-- Delivery-level monitoring flags / envelope
ALTER TABLE public.deliveries ADD COLUMN IF NOT EXISTS requires_temperature_monitoring boolean NOT NULL DEFAULT false;
ALTER TABLE public.deliveries ADD COLUMN IF NOT EXISTS temp_alert_min_c numeric;
ALTER TABLE public.deliveries ADD COLUMN IF NOT EXISTS temp_alert_max_c numeric;
ALTER TABLE public.deliveries ADD COLUMN IF NOT EXISTS has_hazmat boolean NOT NULL DEFAULT false;
ALTER TABLE public.deliveries ADD COLUMN IF NOT EXISTS requires_signature boolean NOT NULL DEFAULT false;

CREATE TABLE IF NOT EXISTS public.temperature_readings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants (id) ON DELETE CASCADE,
  delivery_id uuid NOT NULL REFERENCES public.deliveries (id) ON DELETE CASCADE,
  reading_value numeric NOT NULL,
  timestamp timestamptz NOT NULL DEFAULT now(),
  device_id text NOT NULL,
  within_range boolean NOT NULL DEFAULT true,
  metadata jsonb NOT NULL DEFAULT '{}'
);

CREATE INDEX IF NOT EXISTS idx_temperature_readings_delivery_time
  ON public.temperature_readings (delivery_id, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_temperature_readings_tenant_time
  ON public.temperature_readings (tenant_id, timestamp DESC);

COMMENT ON TABLE public.returns IS 'RMA / reverse logistics; org approves and processes.';
COMMENT ON TABLE public.return_items IS 'Line items included in a return with condition and restock flags.';
COMMENT ON TABLE public.temperature_readings IS 'IoT cold-chain samples (Smartrac, Sensitech, Tempmate-compatible ingestion).';
