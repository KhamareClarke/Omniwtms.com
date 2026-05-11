import { createAdminServiceClient } from "@/lib/supabase/admin-service";
import { sendTemplateEmail } from "@/lib/email/send";
function publicAppUrl(): string {
  const u = process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (u) return u.replace(/\/$/, "");
  return "";
}

export async function getCustomerEmail(customerId: string): Promise<string | null> {
  const supabase = createAdminServiceClient();
  const { data } = await supabase.from("customers").select("email, name").eq("id", customerId).maybeSingle();
  const row = data as { email?: string | null; name?: string | null } | null;
  const email = row?.email?.trim();
  return email || null;
}

export async function sendReturnEmail(input: {
  templateId:
    | "return-created"
    | "return-approved"
    | "return-rejected"
    | "return-received"
    | "refund-processed";
  tenantId: string;
  customerId: string;
  variables: Record<string, string>;
}): Promise<void> {
  const to = await getCustomerEmail(input.customerId);
  if (!to) return;
  await sendTemplateEmail({
    to,
    templateId: input.templateId as import("@/lib/email/templates").TemplateId,
    tenantId: input.tenantId,
    variables: {
      customerName: input.variables.customerName ?? "Customer",
      ...input.variables,
    },
  });
}

export function returnLabelUrl(returnId: string): string {
  const base = publicAppUrl();
  const path = `/api/returns/${returnId}/label`;
  return base ? `${base}${path}` : path;
}
