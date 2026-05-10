import { createAdminServiceClient } from "@/lib/supabase/admin-service";

export type EmailPref = { enabled?: boolean; frequency?: "immediate" | "daily" | "weekly" | "never" };

export async function getNotificationPreferences(tenantId: string): Promise<{
  email: Record<string, EmailPref>;
  smsEnabled: boolean;
  pushEnabled: boolean;
  smsProvider: string;
} | null> {
  const supabase = createAdminServiceClient();
  const { data, error } = await supabase
    .from("notification_preferences")
    .select("email, sms_enabled, push_enabled, sms_provider")
    .eq("tenant_id", tenantId)
    .maybeSingle();
  if (error || !data) return null;
  const row = data as {
    email?: Record<string, EmailPref>;
    sms_enabled?: boolean;
    push_enabled?: boolean;
    sms_provider?: string;
  };
  return {
    email: row.email ?? {},
    smsEnabled: row.sms_enabled ?? false,
    pushEnabled: row.push_enabled ?? false,
    smsProvider: row.sms_provider ?? "ghl",
  };
}

/** If no row or no entry for template → send. Otherwise respect enabled + never. */
export async function isEmailEnabledForTenant(
  tenantId: string,
  templateId: string
): Promise<boolean> {
  const prefs = await getNotificationPreferences(tenantId);
  if (!prefs) return true;
  const p = prefs.email[templateId];
  if (!p) return true;
  if (p.frequency === "never") return false;
  if (p.enabled === false) return false;
  return true;
}

/** SMS: on when no prefs row yet; otherwise use saved sms_enabled (defaults true on new rows). */
export async function isSmsEnabledForTenant(tenantId: string): Promise<boolean> {
  const prefs = await getNotificationPreferences(tenantId);
  if (!prefs) return true;
  return Boolean(prefs.smsEnabled);
}

export async function upsertNotificationPreferences(
  tenantId: string,
  patch: {
    email?: Record<string, EmailPref>;
    smsEnabled?: boolean;
    pushEnabled?: boolean;
    smsProvider?: string;
  }
): Promise<void> {
  const supabase = createAdminServiceClient();
  const existing = await getNotificationPreferences(tenantId);
  const email = patch.email ?? existing?.email ?? {};
  const { error } = await supabase.from("notification_preferences").upsert(
    {
      tenant_id: tenantId,
      email,
      sms_enabled: patch.smsEnabled ?? existing?.smsEnabled ?? false,
      push_enabled: patch.pushEnabled ?? existing?.pushEnabled ?? false,
      sms_provider: patch.smsProvider ?? existing?.smsProvider ?? "ghl",
      updated_at: new Date().toISOString(),
    },
    { onConflict: "tenant_id" }
  );
  if (error) throw new Error(error.message);
}
