import { NextRequest, NextResponse } from "next/server";
import { createAdminServiceClient } from "@/lib/supabase/admin-service";
import { DEFAULT_TENANT_ID } from "@/lib/tenants/constants";
import { sendTemplateEmail } from "@/lib/email/send";
import { isEmailOutgoingConfigured } from "@/lib/email/config";
import { isTemplateId } from "@/lib/email/templates/types";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const to = String(body.to || "").trim();
    const clientId = typeof body.client_id === "string" ? body.client_id.trim() : "";
    const templateId = String(body.template_id || "org-welcome");
    if (!to || !clientId) {
      return NextResponse.json({ error: "to and client_id required" }, { status: 400 });
    }
    if (!isTemplateId(templateId)) {
      return NextResponse.json({ error: "Invalid template_id" }, { status: 400 });
    }
    const supabase = createAdminServiceClient();
    const { data } = await supabase.from("clients").select("tenant_id, company, email").eq("id", clientId).maybeSingle();
    const row = data as { tenant_id?: string; company?: string; email?: string } | null;
    const tenantId = row?.tenant_id?.trim() || DEFAULT_TENANT_ID;
    if (!(await isEmailOutgoingConfigured(tenantId))) {
      return NextResponse.json({ error: "Email not configured (SMTP or GHL for this tenant)" }, { status: 503 });
    }
    const orgName = row?.company || "Your organization";

    const r = await sendTemplateEmail({
      to,
      templateId,
      variables: {
        orgName,
        customerName: orgName,
      },
      tenantId,
      force: true,
    });
    if (!r.ok) return NextResponse.json({ error: r.error }, { status: 500 });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: "Bad request" }, { status: 400 });
  }
}
