-- Empire OS recommendation actions tracking (accept / dismiss / snooze)

CREATE TABLE IF NOT EXISTS public.empire_os_recommendation_actions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  recommendation_id text NOT NULL,
  action text NOT NULL CHECK (action IN ('accepted','dismissed','snoozed')),
  actor text,
  metadata jsonb NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_empire_os_rec_actions_tenant_created
  ON public.empire_os_recommendation_actions(tenant_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_empire_os_rec_actions_tenant_rec
  ON public.empire_os_recommendation_actions(tenant_id, recommendation_id, created_at DESC);

COMMENT ON TABLE public.empire_os_recommendation_actions IS 'Tracks operator actions taken on analytics recommendations surfaced via Empire OS dashboard.';
