import { createAdminServiceClient } from "@/lib/supabase/admin-service";
import { DEFAULT_TENANT_ID } from "@/lib/tenants/constants";

/** Public branding + identity for white-label UI and email. */
export type TenantBrandingConfig = {
  id: string;
  name: string;
  domain: string | null;
  logo_url: string | null;
  primary_color: string | null;
  secondary_color: string | null;
  text_color: string | null;
  admin_email: string | null;
};

const DEFAULT_COLORS = {
  primary_color: "#3456FF",
  secondary_color: "#5C4EFF",
  text_color: "#111827",
} as const;

function normalizeHostname(raw: string | null | undefined): string {
  if (!raw || typeof raw !== "string") return "";
  const h = raw.split(":")[0]?.trim().toLowerCase() ?? "";
  return h.replace(/\.$/, "");
}

/** localhost, 127.0.0.1, ::1, or bare IPv4 (no domain tenant). */
export function isLocalOrIpHost(host: string): boolean {
  const h = normalizeHostname(host);
  if (!h) return true;
  if (h === "localhost") return true;
  if (h === "::1") return true;
  if (h === "127.0.0.1") return true;
  if (/^\d{1,3}(\.\d{1,3}){3}$/.test(h)) return true;
  return false;
}

function domainLookupCandidates(host: string): string[] {
  const h = normalizeHostname(host);
  if (!h) return [];
  const noWww = h.replace(/^www\./, "");
  const set = new Set<string>([h, noWww]);
  if (!h.startsWith("www.")) set.add(`www.${h}`);
  return [...set];
}

/**
 * Resolve tenant row by matching `tenants.domain` to the request host (exact, with/without www).
 */
export async function getTenantByDomain(hostname: string): Promise<{ id: string } | null> {
  const host = normalizeHostname(hostname);
  if (!host || isLocalOrIpHost(host)) return null;

  const supabase = createAdminServiceClient();
  for (const domain of domainLookupCandidates(host)) {
    const { data, error } = await supabase
      .from("tenants")
      .select("id")
      .eq("domain", domain)
      .maybeSingle();
    if (!error && data?.id) return { id: data.id as string };
  }
  return null;
}

export async function getTenantConfig(tenantId: string): Promise<TenantBrandingConfig | null> {
  if (!tenantId?.trim()) return null;
  const supabase = createAdminServiceClient();
  const { data, error } = await supabase
    .from("tenants")
    .select("id, name, domain, logo_url, primary_color, secondary_color, text_color, admin_email")
    .eq("id", tenantId)
    .maybeSingle();
  if (error || !data) return null;
  const row = data as Record<string, unknown>;
  return {
    id: String(row.id),
    name: String(row.name ?? "Organization"),
    domain: row.domain != null ? String(row.domain) : null,
    logo_url: row.logo_url != null ? String(row.logo_url) : null,
    primary_color: row.primary_color != null ? String(row.primary_color) : null,
    secondary_color: row.secondary_color != null ? String(row.secondary_color) : null,
    text_color: row.text_color != null ? String(row.text_color) : null,
    admin_email: row.admin_email != null ? String(row.admin_email) : null,
  };
}

/** Merge DB values with safe defaults for CSS / email. */
export function withDefaultBranding(config: TenantBrandingConfig | null): Required<
  Pick<TenantBrandingConfig, "name" | "primary_color" | "secondary_color" | "text_color">
> & {
  id: string;
  logo_url: string | null;
  domain: string | null;
  admin_email: string | null;
} {
  if (!config) {
    return {
      id: DEFAULT_TENANT_ID,
      name: "OmniWTMS",
      domain: null,
      logo_url: null,
      primary_color: DEFAULT_COLORS.primary_color,
      secondary_color: DEFAULT_COLORS.secondary_color,
      text_color: DEFAULT_COLORS.text_color,
      admin_email: null,
    };
  }
  return {
    id: config.id,
    name: config.name || "Organization",
    domain: config.domain,
    logo_url: config.logo_url,
    primary_color: config.primary_color || DEFAULT_COLORS.primary_color,
    secondary_color: config.secondary_color || DEFAULT_COLORS.secondary_color,
    text_color: config.text_color || DEFAULT_COLORS.text_color,
    admin_email: config.admin_email,
  };
}

export type TenantBrandingPatch = Partial<{
  name: string;
  domain: string | null;
  logo_url: string | null;
  primary_color: string | null;
  secondary_color: string | null;
  text_color: string | null;
  admin_email: string | null;
}>;

/** Server-only: update tenant branding (call from admin API routes). */
export async function updateTenantBranding(
  tenantId: string,
  patch: TenantBrandingPatch
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!tenantId?.trim()) return { ok: false, error: "tenantId required" };
  const supabase = createAdminServiceClient();
  const row: Record<string, unknown> = {};
  if (patch.name !== undefined) row.name = patch.name;
  if (patch.domain !== undefined) row.domain = patch.domain;
  if (patch.logo_url !== undefined) row.logo_url = patch.logo_url;
  if (patch.primary_color !== undefined) row.primary_color = patch.primary_color;
  if (patch.secondary_color !== undefined) row.secondary_color = patch.secondary_color;
  if (patch.text_color !== undefined) row.text_color = patch.text_color;
  if (patch.admin_email !== undefined) row.admin_email = patch.admin_email;
  if (Object.keys(row).length === 0) return { ok: false, error: "No fields to update" };
  row.updated_at = new Date().toISOString();

  const { error } = await supabase.from("tenants").update(row).eq("id", tenantId);
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}
