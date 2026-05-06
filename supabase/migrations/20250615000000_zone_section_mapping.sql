-- Zone-to-Section Mapping
-- Links warehouse_sections (2D grid cells) to warehouse_zones for zone-based organization.
-- Enables mapping floor plan grid cells to logical zones (Receiving, Storage A, Picking, etc.)

-- Add zone_id to warehouse_sections (nullable; existing sections may be unassigned)
ALTER TABLE public.warehouse_sections
  ADD COLUMN IF NOT EXISTS zone_id uuid REFERENCES public.warehouse_zones(id) ON DELETE SET NULL;

-- Index for zone-based queries
CREATE INDEX IF NOT EXISTS idx_warehouse_sections_zone_id ON public.warehouse_sections(zone_id);

COMMENT ON COLUMN public.warehouse_sections.zone_id IS 'Optional FK to warehouse_zones. Links this grid cell to a logical zone (Receiving, Storage, Picking, etc.).';
