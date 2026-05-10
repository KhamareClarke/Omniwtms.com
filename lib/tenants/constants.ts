/** Canonical request header for resolved tenant (set by middleware from cookie / incoming header). */
export const TENANT_ID_HEADER = "x-tenant-id";

/** HttpOnly cookie set by POST /api/auth/sync-tenant after org/courier/customer login. */
export const TENANT_ID_COOKIE = "wtms_tenant_id";

/** Fallback when DB row has no tenant_id (legacy data). */
export const DEFAULT_TENANT_ID = "a0000001-0000-4000-8000-000000000001";
