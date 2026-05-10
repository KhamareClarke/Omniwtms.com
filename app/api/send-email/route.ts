import { NextRequest, NextResponse } from "next/server";
import { sendEmail, brandedEmailHtml, loadMailBranding } from "@/lib/email";
import { isEmailOutgoingConfigured } from "@/lib/email/config";
import { createAdminServiceClient } from "@/lib/supabase/admin-service";
import { DEFAULT_TENANT_ID } from "@/lib/tenants/constants";

/**
 * POST /api/send-email
 * Body: { to, subject, html, text?, tenant_id?, client_id? }
 * Sends via SMTP or Go High Level (USE_GHL_EMAIL + GHL keys on tenant or env).
 * tenant_id or client_id (resolves clients.tenant_id) enables white-label wrapper + from name.
 */
export async function POST(request: NextRequest) {
  try {

    const body = await request.json();
    const { to, subject, html, text, tenant_id: tenantId, client_id: clientId } = body;

    if (!to || !subject || !html) {
      return NextResponse.json(
        { error: "to, subject, and html are required" },
        { status: 400 }
      );
    }

    let resolvedTenantId =
      typeof tenantId === "string" && tenantId.trim().length > 0 ? tenantId.trim() : null;

    if (!resolvedTenantId && typeof clientId === "string" && clientId.trim().length > 0) {
      const supabase = createAdminServiceClient();
      const { data, error } = await supabase
        .from("clients")
        .select("tenant_id")
        .eq("id", clientId.trim())
        .maybeSingle();
      if (!error && data) {
        const tid = (data as { tenant_id?: string | null }).tenant_id;
        resolvedTenantId = tid?.trim() || DEFAULT_TENANT_ID;
      }
    }

    if (!(await isEmailOutgoingConfigured(resolvedTenantId))) {
      return NextResponse.json(
        {
          error:
            "Email not configured. Set EMAIL_USER and EMAIL_PASS for SMTP, or USE_GHL_EMAIL=true with GHL API key and location id (env or tenant).",
        },
        { status: 503 }
      );
    }

    const branding = resolvedTenantId ? await loadMailBranding(resolvedTenantId) : null;
    const finalHtml = branding ? brandedEmailHtml(html, subject, branding) : html;
    const fromName = branding?.companyName;

    await sendEmail({
      to,
      subject,
      html: finalHtml,
      text,
      fromDisplayName: fromName,
      tenantId: resolvedTenantId ?? undefined,
    });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Send email error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to send email" },
      { status: 500 }
    );
  }
}
