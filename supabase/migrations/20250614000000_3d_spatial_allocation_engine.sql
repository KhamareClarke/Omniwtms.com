-- 3D Spatial Allocation Engine
-- Storage locations (bins) with x,y,z coordinates, capacity validation, and bin-level inventory.

-- warehouse_bins: 3D storage locations (x, y, z) with capacity constraints
CREATE TABLE IF NOT EXISTS public.warehouse_bins (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  warehouse_id uuid NOT NULL REFERENCES public.warehouses(id) ON DELETE CASCADE,
  section_id uuid REFERENCES public.warehouse_sections(id) ON DELETE SET NULL,
  x integer NOT NULL,
  y integer NOT NULL,
  z integer NOT NULL,
  max_quantity integer NOT NULL DEFAULT 0,
  max_volume numeric DEFAULT 0,
  current_quantity integer NOT NULL DEFAULT 0,
  current_volume numeric DEFAULT 0,
  bin_code text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(warehouse_id, x, y, z)
);

CREATE INDEX idx_warehouse_bins_warehouse ON public.warehouse_bins(warehouse_id);
CREATE INDEX idx_warehouse_bins_section ON public.warehouse_bins(section_id);
CREATE INDEX idx_warehouse_bins_coords ON public.warehouse_bins(warehouse_id, x, y, z);

-- bin_allocations: product quantity allocated to a specific bin (3D location)
CREATE TABLE IF NOT EXISTS public.bin_allocations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bin_id uuid NOT NULL REFERENCES public.warehouse_bins(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  quantity integer NOT NULL DEFAULT 0,
  volume_used numeric DEFAULT 0,
  client_id uuid,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX idx_bin_allocations_bin ON public.bin_allocations(bin_id);
CREATE INDEX idx_bin_allocations_product ON public.bin_allocations(product_id);

-- Trigger: update bin current_quantity and current_volume when allocations change
CREATE OR REPLACE FUNCTION update_bin_usage()
RETURNS TRIGGER AS $$
DECLARE
  target_bin_id uuid;
BEGIN
  IF TG_OP = 'DELETE' THEN
    target_bin_id := OLD.bin_id;
  ELSE
    target_bin_id := NEW.bin_id;
  END IF;

  UPDATE public.warehouse_bins
  SET
    current_quantity = (SELECT COALESCE(SUM(quantity), 0) FROM public.bin_allocations WHERE bin_id = target_bin_id),
    current_volume = (SELECT COALESCE(SUM(volume_used), 0) FROM public.bin_allocations WHERE bin_id = target_bin_id),
    updated_at = now()
  WHERE id = target_bin_id;

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_bin_usage ON public.bin_allocations;
CREATE TRIGGER trigger_update_bin_usage
  AFTER INSERT OR UPDATE OR DELETE ON public.bin_allocations
  FOR EACH ROW EXECUTE FUNCTION update_bin_usage();

-- RLS
ALTER TABLE public.warehouse_bins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bin_allocations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow read warehouse_bins" ON public.warehouse_bins;
CREATE POLICY "Allow read warehouse_bins" ON public.warehouse_bins FOR SELECT USING (true);
DROP POLICY IF EXISTS "Allow insert warehouse_bins" ON public.warehouse_bins;
CREATE POLICY "Allow insert warehouse_bins" ON public.warehouse_bins FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Allow update warehouse_bins" ON public.warehouse_bins;
CREATE POLICY "Allow update warehouse_bins" ON public.warehouse_bins FOR UPDATE USING (true);
DROP POLICY IF EXISTS "Allow delete warehouse_bins" ON public.warehouse_bins;
CREATE POLICY "Allow delete warehouse_bins" ON public.warehouse_bins FOR DELETE USING (true);

DROP POLICY IF EXISTS "Allow read bin_allocations" ON public.bin_allocations;
CREATE POLICY "Allow read bin_allocations" ON public.bin_allocations FOR SELECT USING (true);
DROP POLICY IF EXISTS "Allow insert bin_allocations" ON public.bin_allocations;
CREATE POLICY "Allow insert bin_allocations" ON public.bin_allocations FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Allow update bin_allocations" ON public.bin_allocations;
CREATE POLICY "Allow update bin_allocations" ON public.bin_allocations FOR UPDATE USING (true);
DROP POLICY IF EXISTS "Allow delete bin_allocations" ON public.bin_allocations;
CREATE POLICY "Allow delete bin_allocations" ON public.bin_allocations FOR DELETE USING (true);

COMMENT ON TABLE public.warehouse_bins IS '3D storage locations (x,y,z) with capacity constraints. Spatial allocation engine.';
COMMENT ON TABLE public.bin_allocations IS 'Product allocations at bin level. Coordinates stored via bin reference.';
