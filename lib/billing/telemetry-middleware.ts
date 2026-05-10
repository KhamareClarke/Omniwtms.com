import type { NextRequest } from "next/server";
import { hmacSha256Hex } from "@/lib/billing/telemetry-edge";

const MAX_AGE_MS = 120_000;

function shouldRecordApiUsage(pathname: string): boolean {
  if (!pathname.startsWith("/api/")) return false;
  if (pathname.startsWith("/api/billing/log-api-call")) return false;
  if (pathname.startsWith("/api/stripe/webhook")) return false;
  return true;
}

/**
 * Fire-and-forget: POST signed payload to the Node API route (inserts tenant_api_request_logs).
 */
export function enqueueApiUsageLog(request: NextRequest, pathname: string, tenantId: string | null): void {
  const secret = process.env.TELEMETRY_SIGNING_SECRET?.trim();
  if (!secret || !tenantId || !shouldRecordApiUsage(pathname)) return;

  const ts = Date.now();
  const bodyObj = {
    tenant_id: tenantId,
    path: pathname.slice(0, 512),
    method: request.method.slice(0, 16),
    ts,
  };
  const body = JSON.stringify(bodyObj);

  void (async () => {
    try {
      const sig = await hmacSha256Hex(secret, body);
      const origin = request.nextUrl.origin;
      await fetch(`${origin}/api/billing/log-api-call`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-telemetry-signature": sig,
        },
        body,
      });
    } catch {
      /* ignore */
    }
  })();
}

export function isTelemetryPayloadFresh(ts: number): boolean {
  return Math.abs(Date.now() - ts) <= MAX_AGE_MS;
}
