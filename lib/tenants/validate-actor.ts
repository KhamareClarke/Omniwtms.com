import type { SupabaseClient } from "@supabase/supabase-js";
import { DEFAULT_TENANT_ID } from "@/lib/tenants/constants";

export type ActorKind = "client" | "courier" | "customer";

/**
 * Ensures the given actor row belongs to tenantId (prevents header spoofing when actor id is known).
 */
export async function assertActorBelongsToTenant(
  supabase: SupabaseClient,
  kind: ActorKind,
  actorId: string,
  tenantId: string
): Promise<boolean> {
  const table = kind === "client" ? "clients" : kind === "courier" ? "couriers" : "customers";
  const { data, error } = await supabase.from(table).select("id, tenant_id").eq("id", actorId).maybeSingle();
  if (error || !data) return false;
  const rowTenant = (data as { tenant_id?: string | null }).tenant_id ?? DEFAULT_TENANT_ID;
  return rowTenant === tenantId;
}
