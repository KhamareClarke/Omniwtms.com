-- Phase 8: Stripe subscription fields, monthly invoices, API usage logs

BEGIN;

ALTER TABLE public.tenants
  ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT,
  ADD COLUMN IF NOT EXISTS stripe_price_id TEXT,
  ADD COLUMN IF NOT EXISTS billing_cycle_day INT NOT NULL DEFAULT 1;

ALTER TABLE public.tenants DROP CONSTRAINT IF EXISTS tenants_billing_cycle_day_check;
ALTER TABLE public.tenants
  ADD CONSTRAINT tenants_billing_cycle_day_check
  CHECK (billing_cycle_day >= 1 AND billing_cycle_day <= 28);

CREATE TABLE IF NOT EXISTS public.tenant_billing_invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants (id) ON DELETE CASCADE,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  currency TEXT NOT NULL DEFAULT 'GBP',
  base_amount_gbp NUMERIC(14, 4) NOT NULL DEFAULT 0,
  overage_amount_gbp NUMERIC(14, 4) NOT NULL DEFAULT 0,
  total_amount_gbp NUMERIC(14, 4) NOT NULL DEFAULT 0,
  line_items JSONB NOT NULL DEFAULT '[]'::jsonb,
  status TEXT NOT NULL DEFAULT 'open'
    CHECK (status IN ('draft', 'open', 'paid', 'overdue', 'void')),
  stripe_invoice_id TEXT,
  paid_at TIMESTAMPTZ,
  due_at DATE,
  overdue_reminder_level INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_tenant_billing_invoices_tenant ON public.tenant_billing_invoices (tenant_id);
CREATE INDEX IF NOT EXISTS idx_tenant_billing_invoices_status ON public.tenant_billing_invoices (status);
CREATE INDEX IF NOT EXISTS idx_tenant_billing_invoices_created ON public.tenant_billing_invoices (created_at DESC);

CREATE TABLE IF NOT EXISTS public.tenant_api_request_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants (id) ON DELETE CASCADE,
  path TEXT,
  method TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_tenant_api_logs_tenant_created ON public.tenant_api_request_logs (tenant_id, created_at DESC);

COMMENT ON TABLE public.tenant_billing_invoices IS 'Monthly usage statements; PDF generated on download.';
COMMENT ON TABLE public.tenant_api_request_logs IS 'Per-tenant API volume; ingest from gateway or middleware.';

ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS tenant_id uuid REFERENCES public.tenants (id);
CREATE INDEX IF NOT EXISTS idx_customers_tenant_id ON public.customers (tenant_id);

COMMIT;
