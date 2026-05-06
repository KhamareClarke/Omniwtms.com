-- Admins table: unique login for admin only (not shared with clients/couriers/customers)
CREATE TABLE IF NOT EXISTS admins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  password TEXT NOT NULL,
  name TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_admins_email ON admins(email);

-- Insert single admin user (unique email & password – change password after first login if needed)
-- Email: admin@omniwtms.com
-- Password: OmniAdmin2025!
INSERT INTO admins (email, password, name, status)
VALUES (
  'admin@omniwtms.com',
  'OmniAdmin2025!',
  'OmniWTMS Admin',
  'active'
)
ON CONFLICT (email) DO NOTHING;

COMMENT ON TABLE admins IS 'Admin-only logins; separate from clients. Use /auth/admin to sign in.';
