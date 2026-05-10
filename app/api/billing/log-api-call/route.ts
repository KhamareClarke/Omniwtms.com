import { NextRequest, NextResponse } from "next/server";
import { logTenantApiCall } from "@/lib/billing/usage";
import { hmacSha256Hex, timingSafeEqualHex } from "@/lib/billing/telemetry-edge";
import { isTelemetryPayloadFresh } from "@/lib/billing/telemetry-middleware";
import { isValidTenantId } from "@/lib/tenants/context";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const secret = process.env.TELEMETRY_SIGNING_SECRET?.trim();
  if (!secret) {
    return NextResponse.json({ error: "TELEMETRY_SIGNING_SECRET not configured" }, { status: 503 });
  }

  const sigHeader = request.headers.get("x-telemetry-signature")?.trim();
  if (!sigHeader) return NextResponse.json({ error: "Missing signature" }, { status: 401 });

  let raw: string;
  try {
    raw = await request.text();
  } catch {
    return NextResponse.json({ error: "Bad body" }, { status: 400 });
  }

  const expected = await hmacSha256Hex(secret, raw);
  if (!timingSafeEqualHex(expected.toLowerCase(), sigHeader.toLowerCase())) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  let body: { tenant_id?: string; path?: string; method?: string; ts?: number };
  try {
    body = JSON.parse(raw);
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (typeof body.ts !== "number" || !isTelemetryPayloadFresh(body.ts)) {
    return NextResponse.json({ error: "Stale or invalid timestamp" }, { status: 400 });
  }

  const tenantId = typeof body.tenant_id === "string" ? body.tenant_id.trim() : "";
  if (!isValidTenantId(tenantId)) return NextResponse.json({ error: "Invalid tenant" }, { status: 400 });

  const path = typeof body.path === "string" ? body.path : "/api";
  const method = typeof body.method === "string" ? body.method : "GET";

  await logTenantApiCall(tenantId, path, method);
  return NextResponse.json({ ok: true });
}
