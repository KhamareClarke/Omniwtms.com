import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import {
  TENANT_ID_HEADER,
  TENANT_ID_COOKIE,
} from "@/lib/tenants/constants";
import {
  getTenantIdFromRequest,
  isTenantMiddlewareSkippedPath,
  isValidTenantId,
} from "@/lib/tenants/context";
import { getTenantByDomain, isLocalOrIpHost } from "@/lib/tenants/config";
import { enqueueApiUsageLog } from "@/lib/billing/telemetry-middleware";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (isTenantMiddlewareSkippedPath(pathname)) {
    enqueueApiUsageLog(request, pathname, getTenantIdFromRequest(request));
    return NextResponse.next();
  }

  const incomingHeader = request.headers.get(TENANT_ID_HEADER)?.trim();
  const cookieVal = request.cookies.get(TENANT_ID_COOKIE)?.value?.trim();

  let tenantId: string | null = null;
  if (isValidTenantId(incomingHeader)) {
    tenantId = incomingHeader;
  } else if (isValidTenantId(cookieVal)) {
    tenantId = cookieVal;
  }

  if (!tenantId) {
    const host =
      request.headers.get("x-forwarded-host")?.split(",")[0]?.trim() ||
      request.headers.get("host") ||
      request.nextUrl.hostname ||
      "";
    const hostOnly = host.split(":")[0] ?? "";
    if (hostOnly && !isLocalOrIpHost(hostOnly)) {
      try {
        const row = await getTenantByDomain(hostOnly);
        if (row?.id && isValidTenantId(row.id)) {
          tenantId = row.id;
        }
      } catch {
        /* missing service role or network — fall through without domain tenant */
      }
    }
  }

  const requestHeaders = new Headers(request.headers);
  if (tenantId) {
    requestHeaders.set(TENANT_ID_HEADER, tenantId);
  }

  enqueueApiUsageLog(request, pathname, tenantId);

  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
