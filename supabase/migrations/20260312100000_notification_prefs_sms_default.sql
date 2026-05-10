-- Default SMS on for new org notification rows (orgs can turn off in UI)
ALTER TABLE public.notification_preferences
  ALTER COLUMN sms_enabled SET DEFAULT true;
