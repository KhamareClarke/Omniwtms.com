import { createAdminServiceClient } from "@/lib/supabase/admin-service";
import type { GhlAuth } from "./types";

/**
 * Resolve GHL Private Integration Token + location id for a tenant (DB overrides env).
 */
export async function getGhlCredentialsForTenant(
  tenantId: string | null | undefined
): Promise<GhlAuth | null> {
  const envKey = process.env.GHL_API_KEY?.trim();
  const envLoc = process.env.GHL_LOCATION_ID?.trim();

  if (tenantId?.trim()) {
    const supabase = createAdminServiceClient();
    const { data } = await supabase
      .from("tenants")
      .select("ghl_location_id, ghl_api_key")
      .eq("id", tenantId.trim())
      .maybeSingle();
    const row = data as { ghl_location_id?: string | null; ghl_api_key?: string | null } | null;
    const key = row?.ghl_api_key?.trim() || envKey || null;
    const loc = row?.ghl_location_id?.trim() || envLoc || null;
    if (key && loc) return { apiKey: key, locationId: loc };
  }

  if (envKey && envLoc) return { apiKey: envKey, locationId: envLoc };
  return null;
}
