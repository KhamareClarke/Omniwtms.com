import { createAdminServiceClient } from "@/lib/supabase/admin-service";

/** Canonical event strings: see `EmpireOSEvents` in `@/lib/integrations/empire-os-dispatch`. */

export type EmpireEventInput = {
  tenantId: string;
  event: string;
  payload: Record<string, unknown>;
};

/**
 * Dispatch tenant event to Empire OS webhook when enabled.
 * Returns `sent=false` when tenant integration is disabled or endpoint missing.
 */
export async function sendEmpireOSEvent(input: EmpireEventInput): Promise<{ sent: boolean; status?: number; error?: string }> {
  const supabase = createAdminServiceClient();
  const { data, error } = await supabase
    .from("tenants")
    .select("feature_empire_os, metadata")
    .eq("id", input.tenantId)
    .maybeSingle();
  if (error || !data) return { sent: false, error: "Tenant not found" };
  const row = data as {
    feature_empire_os?: boolean | null;
    metadata?: { empire_os_webhook_url?: string | null } | null;
  };
  const webhookUrl = row.metadata?.empire_os_webhook_url?.trim() ?? "";
  if (!row.feature_empire_os || !webhookUrl) return { sent: false };

  const res = await fetch(webhookUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      tenant_id: input.tenantId,
      event: input.event,
      payload: input.payload,
      sent_at: new Date().toISOString(),
    }),
  });
  if (!res.ok) return { sent: false, status: res.status, error: `HTTP ${res.status}` };
  return { sent: true, status: res.status };
}
