-- Phase 2: Platform admin audit log + tenant fields for admin dashboard

BEGIN;

ALTER TABLE public.tenants
  ADD COLUMN IF NOT EXISTS admin_name TEXT,
  ADD COLUMN IF NOT EXISTS last_activity_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS next_billing_date DATE,
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS max_team_members INT;

ALTER TABLE public.tenants DROP CONSTRAINT IF EXISTS tenants_status_check;
ALTER TABLE public.tenants
  ADD CONSTRAINT tenants_status_check
  CHECK (status IN ('active', 'suspended', 'trial', 'expired'));

CREATE INDEX IF NOT EXISTS idx_tenants_deleted_at ON public.tenants (deleted_at);
CREATE INDEX IF NOT EXISTS idx_tenants_license_expires ON public.tenants (license_expires_at);

CREATE TABLE IF NOT EXISTS public.platform_admin_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID REFERENCES public.admins(id) ON DELETE SET NULL,
  admin_email TEXT,
  admin_name TEXT,
  action TEXT NOT NULL,
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE SET NULL,
  tenant_name TEXT,
  resource_type TEXT NOT NULL DEFAULT 'tenant',
  details JSONB NOT NULL DEFAULT '{}',
  ip_address TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_platform_admin_audit_created ON public.platform_admin_audit_log (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_platform_admin_audit_tenant ON public.platform_admin_audit_log (tenant_id);
CREATE INDEX IF NOT EXISTS idx_platform_admin_audit_action ON public.platform_admin_audit_log (action);

ALTER TABLE public.platform_admin_audit_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS platform_admin_audit_blocked ON public.platform_admin_audit_log;
CREATE POLICY platform_admin_audit_blocked ON public.platform_admin_audit_log
  FOR ALL TO authenticated
  USING (false)
  WITH CHECK (false);

COMMIT;
