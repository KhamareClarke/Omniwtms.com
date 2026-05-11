-- Phase 17: Time tracking and payroll

CREATE TABLE IF NOT EXISTS public.time_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  employee_id text NOT NULL,
  start_time timestamptz NOT NULL,
  end_time timestamptz,
  break_duration_minutes integer NOT NULL DEFAULT 0,
  task_type text NOT NULL DEFAULT 'general',
  status text NOT NULL DEFAULT 'clocked_in'
    CHECK (status IN ('clocked_in','clocked_out','approved','paid')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_time_logs_tenant_employee ON public.time_logs(tenant_id, employee_id);
CREATE INDEX IF NOT EXISTS idx_time_logs_tenant_start ON public.time_logs(tenant_id, start_time DESC);

CREATE TABLE IF NOT EXISTS public.payroll_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  month_key text NOT NULL, -- YYYY-MM
  gross_pay numeric(12,2) NOT NULL DEFAULT 0,
  deductions numeric(12,2) NOT NULL DEFAULT 0,
  net_pay numeric(12,2) NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','paid')),
  paid_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT payroll_runs_tenant_month_unique UNIQUE (tenant_id, month_key)
);

CREATE INDEX IF NOT EXISTS idx_payroll_runs_tenant_month ON public.payroll_runs(tenant_id, month_key DESC);

COMMENT ON TABLE public.time_logs IS 'Staff/courier clock in-out records for payroll and productivity.';
COMMENT ON TABLE public.payroll_runs IS 'Monthly payroll rollups with paid status.';
