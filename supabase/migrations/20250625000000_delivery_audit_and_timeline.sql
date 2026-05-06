-- Audit log for delivery events (status changes, POD, emails). Admin can see full activity.
CREATE TABLE IF NOT EXISTS delivery_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  delivery_id uuid NOT NULL REFERENCES deliveries(id) ON DELETE CASCADE,
  action text NOT NULL,
  actor_type text,
  actor_id text,
  old_value text,
  new_value text,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_delivery_audit_log_delivery_id ON delivery_audit_log(delivery_id);
CREATE INDEX IF NOT EXISTS idx_delivery_audit_log_created_at ON delivery_audit_log(created_at DESC);

COMMENT ON TABLE delivery_audit_log IS 'Log of delivery events: status_updated, pod_uploaded, email_sent. For admin visibility and support.';

-- Timeline entries: each status step with timestamp (for customer tracking and admin history).
CREATE TABLE IF NOT EXISTS delivery_timeline (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  delivery_id uuid NOT NULL REFERENCES deliveries(id) ON DELETE CASCADE,
  step text NOT NULL,
  occurred_at timestamptz DEFAULT now(),
  metadata jsonb DEFAULT '{}'
);

CREATE INDEX IF NOT EXISTS idx_delivery_timeline_delivery_id ON delivery_timeline(delivery_id);
CREATE INDEX IF NOT EXISTS idx_delivery_timeline_occurred_at ON delivery_timeline(occurred_at DESC);

COMMENT ON TABLE delivery_timeline IS 'Timeline of delivery steps (collected, at_facility, out_for_delivery, delivered) with timestamps.';