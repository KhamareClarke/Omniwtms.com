import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { sendTemplateEmail } from "@/lib/email/send";
import { DEFAULT_TENANT_ID } from "@/lib/tenants/constants";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

/**
 * POST /api/auth/password-reset
 * Body: { email, tenant_id? }
 * Sends Supabase recovery link (branded password-reset template).
 */
export async function POST(request: NextRequest) {
  try {
    if (!url || !serviceKey) {
      return NextResponse.json({ error: "Supabase is not configured" }, { status: 503 });
    }
    const body = await request.json();
    const email = String(body.email || "")
      .trim()
      .toLowerCase();
    const tenantId =
      typeof body.tenant_id === "string" && body.tenant_id.trim() ? body.tenant_id.trim() : DEFAULT_TENANT_ID;
    if (!email) {
      return NextResponse.json({ error: "email is required" }, { status: 400 });
    }

    const admin = createClient(url, serviceKey, { auth: { persistSession: false } });
    const { data, error } = await admin.auth.admin.generateLink({
      type: "recovery",
      email,
      options: {
        redirectTo: `${process.env.NEXT_PUBLIC_APP_URL?.trim() || "http://localhost:3000"}/auth/login`,
      },
    });

    if (error || !data?.properties?.action_link) {
      return NextResponse.json({ ok: true });
    }

    const resetUrl = data.properties.action_link;
    await sendTemplateEmail({
      to: email,
      templateId: "password-reset",
      variables: { customerName: email.split("@")[0] || "there", resetUrl },
      tenantId,
      force: true,
    });

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("password-reset", e);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
