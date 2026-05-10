/** Client-safe shape returned by GET /api/public/tenant-branding (matches server config fields). */
export type PublicTenantBranding = {
  tenant_id: string;
  name: string;
  domain: string | null;
  logo_url: string | null;
  primary_color: string;
  secondary_color: string;
  text_color: string;
};
