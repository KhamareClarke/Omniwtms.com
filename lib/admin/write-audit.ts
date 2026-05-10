import type { SupabaseClient } from "@supabase/supabase-js";
import type { VerifiedAdmin } from "@/lib/auth/require-admin-api";
import { getClientIpFromRequest } from "@/lib/admin/client-ip";

export async function writePlatformAudit(
  supabase: SupabaseClient,
  admin: VerifiedAdmin,
  req: Request,
  params: {
    action: string;
    tenantId?: string | null;
    tenantName?: string | null;
    resourceType?: string;
    details?: Record<string, unknown>;
    ip?: string | null;
  }
): Promise<void> {
  const ip = params.ip ?? getClientIpFromRequest(req);
  const { error } = await supabase.from("platform_admin_audit_log").insert({
    admin_id: admin.id,
    admin_email: admin.email,
    admin_name: admin.name,
    action: params.action,
    tenant_id: params.tenantId ?? null,
    tenant_name: params.tenantName ?? null,
    resource_type: params.resourceType ?? "tenant",
    details: params.details ?? {},
    ip_address: ip,
  });
  if (error) {
    console.error("writePlatformAudit:", error);
  }
}
