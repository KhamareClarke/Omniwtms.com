import type { SupabaseClient } from "@supabase/supabase-js";

/** Returns true if warehouse belongs to tenant. */
export async function warehouseBelongsToTenant(
  supabase: SupabaseClient,
  warehouseId: string,
  tenantId: string
): Promise<boolean> {
  const { data, error } = await supabase
    .from("warehouses")
    .select("id")
    .eq("id", warehouseId)
    .eq("tenant_id", tenantId)
    .maybeSingle();
  return !error && !!data;
}

export async function layoutBelongsToTenant(
  supabase: SupabaseClient,
  layoutId: string,
  tenantId: string
): Promise<boolean> {
  const { data, error } = await supabase
    .from("warehouse_layouts")
    .select("id")
    .eq("id", layoutId)
    .eq("tenant_id", tenantId)
    .maybeSingle();
  return !error && !!data;
}

export async function sectionBelongsToTenant(
  supabase: SupabaseClient,
  sectionId: string,
  tenantId: string
): Promise<boolean> {
  const { data: sec, error: e1 } = await supabase
    .from("warehouse_sections")
    .select("layout_id")
    .eq("id", sectionId)
    .maybeSingle();
  if (e1 || !sec?.layout_id) return false;
  return layoutBelongsToTenant(supabase, sec.layout_id as string, tenantId);
}
