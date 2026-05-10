-- Phase 11/12: E-commerce integration registry + sync audit (server routes use service role).

CREATE TABLE IF NOT EXISTS public.ecommerce_integrations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants (id) ON DELETE CASCADE,
  provider text NOT NULL CHECK (provider IN ('shopify', 'amazon', 'ebay', 'woocommerce')),
  display_name text,
  shop_identifier text,
  status text NOT NULL DEFAULT 'disconnected' CHECK (status IN ('pending', 'connected', 'error', 'disconnected')),
  access_token text,
  refresh_token text,
  metadata jsonb NOT NULL DEFAULT '{}',
  last_sync_at timestamptz,
  last_error text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ecommerce_integrations_tenant ON public.ecommerce_integrations (tenant_id);
CREATE INDEX IF NOT EXISTS idx_ecommerce_integrations_provider ON public.ecommerce_integrations (provider);

CREATE UNIQUE INDEX IF NOT EXISTS ecommerce_integrations_tenant_provider_shop
  ON public.ecommerce_integrations (tenant_id, provider, COALESCE(shop_identifier, ''));

CREATE TABLE IF NOT EXISTS public.ecommerce_sync_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants (id) ON DELETE CASCADE,
  integration_id uuid REFERENCES public.ecommerce_integrations (id) ON DELETE SET NULL,
  provider text NOT NULL,
  level text NOT NULL DEFAULT 'info' CHECK (level IN ('info', 'warn', 'error')),
  action text NOT NULL,
  detail jsonb NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ecommerce_sync_logs_tenant_created ON public.ecommerce_sync_logs (tenant_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ecommerce_sync_logs_integration ON public.ecommerce_sync_logs (integration_id);

COMMENT ON TABLE public.ecommerce_integrations IS 'External store connections; tokens should be rotated / stored via secrets manager in production.';
COMMENT ON TABLE public.ecommerce_sync_logs IS 'Append-only sync and webhook activity for e-commerce connectors.';
