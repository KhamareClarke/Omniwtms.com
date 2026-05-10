import { NextRequest, NextResponse } from "next/server";
import { createAdminServiceClient } from "@/lib/supabase/admin-service";
import { DEFAULT_TENANT_ID } from "@/lib/tenants/constants";
import { sendTemplateEmail } from "@/lib/email/send";
import { maybeSendTenantSms } from "@/lib/sms/dispatch";
import { ensureStripeBillingForTenant } from "@/lib/stripe/ensure-tenant-billing";

/**
 * POST /api/auth/signup
 * Body: { email, password, company, tenant_id?, phone? }
 * Creates a client row and sends org-welcome (prefer this over browser-side service key).
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const email = String(body.email || "")
      .trim()
      .toLowerCase();
    const password = String(body.password || "");
    const company = String(body.company || "").trim();
    const tenantId = typeof body.tenant_id === "string" && body.tenant_id.trim() ? body.tenant_id.trim() : DEFAULT_TENANT_ID;

    if (!email || !password || !company) {
      return NextResponse.json({ error: "email, password, and company are required" }, { status: 400 });
    }

    const supabase = createAdminServiceClient();
    const { data: existing } = await supabase.from("clients").select("id").eq("email", email).maybeSingle();
    if (existing) {
      return NextResponse.json({ error: "An account with this email already exists" }, { status: 409 });
    }

    const { data: inserted, error } = await supabase
      .from("clients")
      .insert({
        email,
        password,
        company,
        status: "active",
        tenant_id: tenantId,
      })
      .select("id")
      .single();

    if (error) {
      console.error("signup insert", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const stripeBootstrap = await ensureStripeBillingForTenant(tenantId, email);
    if (!stripeBootstrap.ok) {
      console.warn("signup stripe bootstrap:", stripeBootstrap.error);
    }

    await sendTemplateEmail({
      to: email,
      templateId: "org-welcome",
      variables: { orgName: company, customerName: company },
      tenantId,
      force: true,
    });

    const phone = String(body.phone || "").trim();
    if (phone) {
      await maybeSendTenantSms({
        tenantId,
        to: phone,
        body: `Welcome to ${company}. Sign in: ${process.env.NEXT_PUBLIC_APP_URL?.trim() || "http://localhost:3000"}/auth/login`,
      });
    }

    return NextResponse.json({ ok: true, client_id: inserted?.id });
  } catch (e) {
    console.error("signup", e);
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}
