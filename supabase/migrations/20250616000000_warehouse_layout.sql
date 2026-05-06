-- Warehouse Layout RLS Policies
-- Enables Row Level Security on warehouse_layouts and warehouse_sections.
-- Schema for these tables is defined in 20250104000000_warehouse_floor_plan_tables.sql

ALTER TABLE public.warehouse_layouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.warehouse_sections ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow read warehouse_layouts" ON public.warehouse_layouts;
CREATE POLICY "Allow read warehouse_layouts" ON public.warehouse_layouts FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow insert warehouse_layouts" ON public.warehouse_layouts;
CREATE POLICY "Allow insert warehouse_layouts" ON public.warehouse_layouts FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Allow update warehouse_layouts" ON public.warehouse_layouts;
CREATE POLICY "Allow update warehouse_layouts" ON public.warehouse_layouts FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Allow delete warehouse_layouts" ON public.warehouse_layouts;
CREATE POLICY "Allow delete warehouse_layouts" ON public.warehouse_layouts FOR DELETE USING (true);

DROP POLICY IF EXISTS "Allow read warehouse_sections" ON public.warehouse_sections;
CREATE POLICY "Allow read warehouse_sections" ON public.warehouse_sections FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow insert warehouse_sections" ON public.warehouse_sections;
CREATE POLICY "Allow insert warehouse_sections" ON public.warehouse_sections FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Allow update warehouse_sections" ON public.warehouse_sections;
CREATE POLICY "Allow update warehouse_sections" ON public.warehouse_sections FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Allow delete warehouse_sections" ON public.warehouse_sections;
CREATE POLICY "Allow delete warehouse_sections" ON public.warehouse_sections FOR DELETE USING (true);
