import { createAdminServiceClient } from "@/lib/supabase/admin-service";
import type { EcommerceProvider } from "@/lib/ecommerce/types";

export async function appendSyncLog(input: {
  tenantId: string;
  integrationId?: string | null;
  provider: EcommerceProvider | string;
  level?: "info" | "warn" | "error";
  action: string;
  detail?: Record<string, unknown>;
}): Promise<void> {
  try {
    const supabase = createAdminServiceClient();
    await supabase.from("ecommerce_sync_logs").insert({
      tenant_id: input.tenantId,
      integration_id: input.integrationId ?? null,
      provider: input.provider,
      level: input.level ?? "info",
      action: input.action,
      detail: input.detail ?? {},
    });
  } catch (e) {
    console.error("appendSyncLog", e);
  }
}
