import type { SupabaseClient } from "@supabase/supabase-js";
import { createAdminServiceClient } from "@/lib/supabase/admin-service";

export function admin(): SupabaseClient {
  return createAdminServiceClient();
}

export function utcDayBounds(d = new Date()): { start: string; end: string } {
  const y = d.getUTCFullYear();
  const m = d.getUTCMonth();
  const day = d.getUTCDate();
  const start = new Date(Date.UTC(y, m, day, 0, 0, 0, 0));
  const end = new Date(Date.UTC(y, m, day, 23, 59, 59, 999));
  return { start: start.toISOString(), end: end.toISOString() };
}

export async function warehouseBelongsToTenant(
  supabase: SupabaseClient,
  tenantId: string,
  warehouseId: string
): Promise<boolean> {
  const { data, error } = await supabase
    .from("warehouses")
    .select("id, tenant_id, client_id")
    .eq("id", warehouseId)
    .maybeSingle();
  if (error || !data) return false;
  const row = data as { tenant_id?: string | null; client_id?: string | null };
  if (row.tenant_id && row.tenant_id === tenantId) return true;
  if (row.client_id) {
    const { data: client } = await supabase
      .from("clients")
      .select("tenant_id")
      .eq("id", row.client_id)
      .maybeSingle();
    const ct = (client as { tenant_id?: string | null } | null)?.tenant_id;
    if (ct && ct === tenantId) return true;
  }
  return false;
}
