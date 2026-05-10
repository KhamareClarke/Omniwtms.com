import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { TENANT_ID_HEADER, TENANT_ID_COOKIE, DEFAULT_TENANT_ID } from "@/lib/tenants/constants";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isValidTenantId(value: string | null | undefined): value is string {
  if (!value || typeof value !== "string") return false;
  const t = value.trim();
  return UUID_RE.test(t);
}

/**
 * Reads tenant id from incoming request (header first, then cookie).
 * Does not validate membership — use validateTenantForActor in API routes when needed.
 */
export function getTenantIdFromRequest(request: NextRequest): string | null {
  const header = request.headers.get(TENANT_ID_HEADER)?.trim();
  if (isValidTenantId(header)) return header;
  const cookie = request.cookies.get(TENANT_ID_COOKIE)?.value?.trim();
  if (isValidTenantId(cookie)) return cookie;
  return null;
}

export type TenantContext = { tenantId: string };

/**
 * Returns tenant context or a JSON error Response.
 */
export function requireTenantId(request: NextRequest): TenantContext | NextResponse {
  const tid = getTenantIdFromRequest(request);
  if (!tid) {
    return NextResponse.json(
      {
        error: "Missing tenant context. Sign in again or call POST /api/auth/sync-tenant.",
        code: "TENANT_REQUIRED",
      },
      { status: 400 }
    );
  }
  return { tenantId: tid };
}

export function resolveTenantIdOrDefault(request: NextRequest): string {
  return getTenantIdFromRequest(request) ?? DEFAULT_TENANT_ID;
}

/** Middleware / routing: skip tenant injection for these path prefixes. */
export function isTenantMiddlewareSkippedPath(pathname: string): boolean {
  if (pathname.startsWith("/_next")) return true;
  if (pathname.startsWith("/api/auth/admin")) return true;
  if (pathname.startsWith("/api/admin")) return true;
  if (pathname.startsWith("/api/public")) return true;
  if (pathname.startsWith("/api/test")) return true;
  if (pathname.startsWith("/api/auth/sync-tenant")) return true;
  if (pathname.startsWith("/api/auth/supabase-session-from-org")) return true;
  if (pathname.startsWith("/api/auth/tenant-info")) return true;
  if (pathname.startsWith("/api/send-email")) return true;
  if (pathname.startsWith("/api/notify-delivery")) return true;
  if (pathname.startsWith("/api/notify-delivery-status")) return true;
  if (pathname.startsWith("/api/auth/signup")) return true;
  if (pathname.startsWith("/api/auth/password-reset")) return true;
  if (pathname.startsWith("/api/orders")) return true;
  if (pathname.startsWith("/api/deliveries")) return true;
  if (pathname.startsWith("/api/invoices")) return true;
  if (pathname.startsWith("/api/payments")) return true;
  if (pathname.startsWith("/api/notifications")) return true;
  if (pathname.startsWith("/api/billing")) return true;
  if (pathname.startsWith("/api/stripe/webhook")) return true;
  if (pathname.startsWith("/api/cron/billing-monthly")) return true;
  if (pathname.startsWith("/api/cron/billing-overdue")) return true;
  if (pathname.startsWith("/api/cron/ecommerce-sync")) return true;
  if (pathname.startsWith("/api/webhooks/")) return true;
  if (pathname.startsWith("/favicon.ico")) return true;
  return false;
}
