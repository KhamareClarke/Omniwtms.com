import { NextRequest, NextResponse } from "next/server";
import {
  getTenantByDomain,
  getTenantConfig,
  isLocalOrIpHost,
  withDefaultBranding,
} from "@/lib/tenants/config";
import { DEFAULT_TENANT_ID } from "@/lib/tenants/constants";

/**
 * GET /api/public/tenant-branding?host=portal.example.com
 * Public JSON for login / dashboard white-label (no secrets).
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const hostParam = searchParams.get("host")?.trim();
    const forwarded = request.headers.get("x-forwarded-host")?.split(",")[0]?.trim();
    const host = hostParam || forwarded || "";

    let tenantId: string | null = null;
    if (host && !isLocalOrIpHost(host)) {
      const row = await getTenantByDomain(host);
      tenantId = row?.id ?? null;
    }
    if (!tenantId) {
      tenantId = DEFAULT_TENANT_ID;
    }

    const raw = await getTenantConfig(tenantId);
    const b = withDefaultBranding(raw);

    return NextResponse.json({
      tenant_id: b.id,
      name: b.name,
      domain: b.domain,
      logo_url: b.logo_url,
      primary_color: b.primary_color,
      secondary_color: b.secondary_color,
      text_color: b.text_color,
    });
  } catch (e) {
    console.error("tenant-branding", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
