-- Ensure public.warehouses exists so "Could not find the table 'public.warehouses' in the schema cache" is resolved.
-- Run this in Supabase SQL Editor if migrations haven't been applied, or run: npx supabase db push

CREATE TABLE IF NOT EXISTS public.warehouses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  location text NOT NULL,
  capacity integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Add columns the app expects (no-op if they already exist; requires Postgres 9.5+)
ALTER TABLE public.warehouses ADD COLUMN IF NOT EXISTS client_id uuid;
ALTER TABLE public.warehouses ADD COLUMN IF NOT EXISTS manager text;
ALTER TABLE public.warehouses ADD COLUMN IF NOT EXISTS coordinates jsonb;
ALTER TABLE public.warehouses ADD COLUMN IF NOT EXISTS utilization numeric DEFAULT 0;
ALTER TABLE public.warehouses ADD COLUMN IF NOT EXISTS revenue numeric DEFAULT 0;
ALTER TABLE public.warehouses ADD COLUMN IF NOT EXISTS products integer DEFAULT 0;
ALTER TABLE public.warehouses ADD COLUMN IF NOT EXISTS status text DEFAULT 'active';

CREATE INDEX IF NOT EXISTS idx_warehouses_client_id ON public.warehouses(client_id);

-- Allow anon/authenticated to read (adjust RLS as needed for your auth)
ALTER TABLE public.warehouses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow read warehouses" ON public.warehouses;
CREATE POLICY "Allow read warehouses" ON public.warehouses FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow insert warehouses" ON public.warehouses;
CREATE POLICY "Allow insert warehouses" ON public.warehouses FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Allow update warehouses" ON public.warehouses;
CREATE POLICY "Allow update warehouses" ON public.warehouses FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Allow delete warehouses" ON public.warehouses;
CREATE POLICY "Allow delete warehouses" ON public.warehouses FOR DELETE USING (true);

COMMENT ON TABLE public.warehouses IS 'Warehouses table required by dashboard; create if missing.';
