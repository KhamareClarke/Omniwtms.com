-- Add notes to warehouse_sections for cell metadata (acceptance: modal allows notes).
ALTER TABLE public.warehouse_sections ADD COLUMN IF NOT EXISTS notes TEXT;
