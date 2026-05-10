-- Phase 3: RLS sees tenant for org users via tenant_memberships OR JWT app_metadata.tenant_id;
-- BEFORE INSERT: fill tenant_id when null and auth.uid() is set (dashboard browser inserts).
--
-- Bootstraps public.tenants + tenant_memberships if missing (same shape as phase 1) so this file
-- can run before or without 20260309000000_phase1_tenants_admin_rls.sql.

BEGIN;

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS public.tenants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  admin_email TEXT,
  domain TEXT UNIQUE,
  logo_url TEXT,
  primary_color TEXT,
  secondary_color TEXT,
  text_color TEXT,
  license_plan TEXT NOT NULL DEFAULT 'standard',
  license_expires_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'trial')),
  stripe_customer_id TEXT,
  feature_live_tracking BOOLEAN NOT NULL DEFAULT false,
  feature_3d_warehouse BOOLEAN NOT NULL DEFAULT false,
  feature_ecommerce BOOLEAN NOT NULL DEFAULT false,
  feature_api_access BOOLEAN NOT NULL DEFAULT false,
  feature_white_label BOOLEAN NOT NULL DEFAULT false,
  feature_advanced_reporting BOOLEAN NOT NULL DEFAULT false,
  feature_empire_os BOOLEAN NOT NULL DEFAULT false,
  max_warehouses INT,
  max_couriers INT,
  max_customers INT,
  max_orders_per_month INT,
  max_api_calls_per_month INT,
  max_storage_gb INT,
  monthly_cost NUMERIC(12, 2),
  ghl_location_id TEXT,
  ghl_api_key TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_tenants_status ON public.tenants (status);
CREATE INDEX IF NOT EXISTS idx_tenants_domain ON public.tenants (domain);

INSERT INTO public.tenants (id, name, admin_email, domain, license_plan, status)
VALUES (
  'a0000001-0000-4000-8000-000000000001'::uuid,
  'Default organization',
  'admin@omniwtms.com',
  'default',
  'enterprise',
  'active'
)
ON CONFLICT (id) DO NOTHING;

CREATE TABLE IF NOT EXISTS public.tenant_memberships (
  user_id UUID NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES public.tenants (id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id)
);

CREATE INDEX IF NOT EXISTS idx_tenant_memberships_tenant ON public.tenant_memberships (tenant_id);

CREATE OR REPLACE FUNCTION public.get_current_tenant_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT tm.tenant_id FROM public.tenant_memberships tm WHERE tm.user_id = auth.uid() LIMIT 1),
    NULLIF(TRIM(COALESCE((auth.jwt() -> 'app_metadata' ->> 'tenant_id'), '')), '')::uuid
  );
$$;

CREATE OR REPLACE FUNCTION public.trg_set_tenant_id_if_null()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.tenant_id IS NULL AND auth.uid() IS NOT NULL THEN
    NEW.tenant_id := public.get_current_tenant_id();
  END IF;
  RETURN NEW;
END;
$$;

DO $$
DECLARE
  r RECORD;
  skip TEXT[] := ARRAY[
    'tenants',
    'admins',
    'tenant_memberships',
    'admin_login_challenges'
  ];
BEGIN
  FOR r IN
    SELECT DISTINCT table_name
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND column_name = 'tenant_id'
      AND table_name <> ALL (skip)
  LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS trg_tenant_default ON public.%I', r.table_name);
    EXECUTE format(
      'CREATE TRIGGER trg_tenant_default BEFORE INSERT ON public.%I FOR EACH ROW EXECUTE FUNCTION public.trg_set_tenant_id_if_null()',
      r.table_name
    );
  END LOOP;
END $$;

-- Customers: restrict to the row linked in JWT (set by /api/auth/supabase-session-from-org for kind=customer).
DO $cust$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name = 'customers'
  ) THEN
    EXECUTE 'DROP POLICY IF EXISTS tenant_isolation ON public.customers';
    EXECUTE 'DROP POLICY IF EXISTS customer_row_scope ON public.customers';
    EXECUTE $pol$
CREATE POLICY customer_row_scope ON public.customers
  FOR ALL TO authenticated
  USING (
    public.is_admin()
    OR (
      tenant_id = public.get_current_tenant_id()
      AND id::text = NULLIF(TRIM(COALESCE((auth.jwt() -> 'app_metadata' ->> 'customer_id'), '')), '')
    )
  )
  WITH CHECK (
    public.is_admin()
    OR (
      tenant_id = public.get_current_tenant_id()
      AND id::text = NULLIF(TRIM(COALESCE((auth.jwt() -> 'app_metadata' ->> 'customer_id'), '')), '')
    )
  )
$pol$;
  END IF;
END;
$cust$;

COMMIT;
