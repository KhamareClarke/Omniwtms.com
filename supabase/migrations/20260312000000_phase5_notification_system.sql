-- Phase 5: notification logs, org preferences (email/SMS/push), indexes

CREATE TABLE IF NOT EXISTS public.notification_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES public.tenants (id) ON DELETE SET NULL,
  channel TEXT NOT NULL CHECK (channel IN ('email', 'sms', 'push')),
  recipient TEXT NOT NULL,
  subject TEXT,
  template_id TEXT,
  status TEXT NOT NULL DEFAULT 'sent' CHECK (status IN ('sent', 'failed', 'skipped', 'queued')),
  provider_message_id TEXT,
  error_message TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  sent_at TIMESTAMPTZ DEFAULT now(),
  opened_at TIMESTAMPTZ,
  clicked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_notification_logs_tenant ON public.notification_logs (tenant_id);
CREATE INDEX IF NOT EXISTS idx_notification_logs_channel ON public.notification_logs (channel);
CREATE INDEX IF NOT EXISTS idx_notification_logs_template ON public.notification_logs (template_id);
CREATE INDEX IF NOT EXISTS idx_notification_logs_sent_at ON public.notification_logs (sent_at DESC);

COMMENT ON TABLE public.notification_logs IS 'Outbound notifications: email (SMTP), SMS (GHL), push (future).';

CREATE TABLE IF NOT EXISTS public.notification_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants (id) ON DELETE CASCADE,
  email JSONB NOT NULL DEFAULT '{}'::jsonb,
  sms_enabled BOOLEAN NOT NULL DEFAULT true,
  push_enabled BOOLEAN NOT NULL DEFAULT false,
  sms_provider TEXT NOT NULL DEFAULT 'ghl',
  updated_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT notification_preferences_tenant_unique UNIQUE (tenant_id)
);

CREATE INDEX IF NOT EXISTS idx_notification_preferences_tenant ON public.notification_preferences (tenant_id);

COMMENT ON TABLE public.notification_preferences IS 'Per-tenant toggles/frequency for notification types; email keys are template_id -> {enabled, frequency}.';
