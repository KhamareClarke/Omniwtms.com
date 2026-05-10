-- Phase 1: Tenants, admin hardening, tenant_id on business tables, RLS, helpers
-- Run in Supabase SQL Editor or via CLI after review.
-- Default tenant UUID for backfill (stable across environments if migration applied once)
-- Change only if you need a different canonical default.

BEGIN;

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ---------------------------------------------------------------------------
-- 1) Tenants
-- ---------------------------------------------------------------------------
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

CREATE INDEX IF NOT EXISTS idx_tenants_status ON public.tenants(status);
CREATE INDEX IF NOT EXISTS idx_tenants_domain ON public.tenants(domain);

-- ---------------------------------------------------------------------------
-- 2) Default tenant + admins column upgrades
-- ---------------------------------------------------------------------------
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

ALTER TABLE public.admins
  ADD COLUMN IF NOT EXISTS password_hash TEXT,
  ADD COLUMN IF NOT EXISTS totp_secret TEXT,
  ADD COLUMN IF NOT EXISTS totp_enabled BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS backup_codes TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  ADD COLUMN IF NOT EXISTS last_login TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS failed_login_attempts INT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS locked_until TIMESTAMPTZ;

ALTER TABLE public.admins ALTER COLUMN password DROP NOT NULL;

-- Widen status if needed (locked optional via locked_until; keep active/inactive)
ALTER TABLE public.admins DROP CONSTRAINT IF EXISTS admins_status_check;
ALTER TABLE public.admins
  ADD CONSTRAINT admins_status_check
  CHECK (status IN ('active', 'inactive', 'locked'));

-- ---------------------------------------------------------------------------
-- 3) Tenant membership (maps auth.users -> tenant for RLS)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.tenant_memberships (
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id)
);

CREATE INDEX IF NOT EXISTS idx_tenant_memberships_tenant ON public.tenant_memberships(tenant_id);

-- ---------------------------------------------------------------------------
-- 4) Admin email OTP challenges (server verifies with service role)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.admin_login_challenges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID NOT NULL REFERENCES public.admins(id) ON DELETE CASCADE,
  code_hash TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  consumed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_admin_login_challenges_admin ON public.admin_login_challenges(admin_id);
CREATE INDEX IF NOT EXISTS idx_admin_login_challenges_expires ON public.admin_login_challenges(expires_at);

-- ---------------------------------------------------------------------------
-- 5) tenant_id on all public base tables except platform tables
-- ---------------------------------------------------------------------------
DO $$
DECLARE
  r RECORD;
  default_tid UUID := 'a0000001-0000-4000-8000-000000000001'::uuid;
  skip TEXT[] := ARRAY[
    'tenants',
    'admins',
    'tenant_memberships',
    'admin_login_challenges'
  ];
BEGIN
  FOR r IN
    SELECT table_name
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_type = 'BASE TABLE'
      AND table_name <> ALL (skip)
  LOOP
    EXECUTE format(
      'ALTER TABLE public.%I ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES public.tenants(id) ON DELETE RESTRICT',
      r.table_name
    );
    EXECUTE format(
      'UPDATE public.%I SET tenant_id = %L WHERE tenant_id IS NULL',
      r.table_name,
      default_tid
    );
    EXECUTE format(
      'ALTER TABLE public.%I ALTER COLUMN tenant_id SET NOT NULL',
      r.table_name
    );
  END LOOP;
END $$;

-- Indexes for tenant_id
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
    SELECT table_name
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_type = 'BASE TABLE'
      AND table_name <> ALL (skip)
  LOOP
    EXECUTE format(
      'CREATE INDEX IF NOT EXISTS %I ON public.%I (tenant_id)',
      'idx_' || r.table_name || '_tenant_id',
      r.table_name
    );
  END LOOP;
END $$;

-- ---------------------------------------------------------------------------
-- 6) Helper functions
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_current_tenant_id()
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT tm.tenant_id
  FROM public.tenant_memberships tm
  WHERE tm.user_id = auth.uid()
  LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (auth.jwt() -> 'app_metadata' ->> 'platform_admin')::boolean,
    false
  )
  OR COALESCE(
    (auth.jwt() -> 'user_metadata' ->> 'platform_admin')::boolean,
    false
  );
$$;

GRANT EXECUTE ON FUNCTION public.get_current_tenant_id() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;

-- ---------------------------------------------------------------------------
-- 7) RLS: drop existing policies on public tables, then re-apply model
-- ---------------------------------------------------------------------------
DO $$
DECLARE
  pol RECORD;
BEGIN
  FOR pol IN
    SELECT schemaname, tablename, policyname
    FROM pg_policies
    WHERE schemaname = 'public'
  LOOP
    EXECUTE format(
      'DROP POLICY IF EXISTS %I ON %I.%I',
      pol.policyname,
      pol.schemaname,
      pol.tablename
    );
  END LOOP;
END $$;

-- Platform tables
ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tenant_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_login_challenges ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenants_select ON public.tenants
  FOR SELECT TO authenticated
  USING (id = public.get_current_tenant_id() OR public.is_admin());

CREATE POLICY tenants_modify ON public.tenants
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY admins_locked ON public.admins
  FOR ALL TO authenticated
  USING (false)
  WITH CHECK (false);

CREATE POLICY tenant_memberships_self ON public.tenant_memberships
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.is_admin());

CREATE POLICY tenant_memberships_admin_write ON public.tenant_memberships
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY admin_challenges_locked ON public.admin_login_challenges
  FOR ALL TO authenticated
  USING (false)
  WITH CHECK (false);

-- Tenant-scoped data
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
    SELECT table_name
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_type = 'BASE TABLE'
      AND table_name <> ALL (skip)
  LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', r.table_name);
    EXECUTE format(
      'CREATE POLICY tenant_isolation ON public.%I FOR ALL TO authenticated
       USING (tenant_id = public.get_current_tenant_id() OR public.is_admin())
       WITH CHECK (tenant_id = public.get_current_tenant_id() OR public.is_admin())',
      r.table_name
    );
  END LOOP;
END $$;

COMMIT;
