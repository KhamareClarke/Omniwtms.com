import { createAdminServiceClient } from "@/lib/supabase/admin-service";
import { getTenantConfig } from "@/lib/tenants/config";
import { sendTemplateEmail } from "@/lib/email/send";

export type DeviationAlertInput = {
  tenantId: string;
  deliveryId: string;
  reading: number;
  min: number;
  max: number;
  deviceId: string;
  packageId: string;
  customerId: string | null;
};

/**
 * Notify customer (if known) and tenant admin email on cold-chain breach.
 */
export async function maybeSendTemperatureDeviationAlert(input: DeviationAlertInput): Promise<void> {
  const supabase = createAdminServiceClient();
  const cfg = await getTenantConfig(input.tenantId);
  const adminEmail = cfg?.admin_email?.trim() || null;

  const vars = {
    customerName: "Customer",
    packageId: input.packageId,
    reading: String(input.reading),
    minTemp: String(input.min),
    maxTemp: String(input.max),
    deviceId: input.deviceId,
    occurredAt: new Date().toISOString(),
  };

  if (input.customerId) {
    const { data: c } = await supabase.from("customers").select("email, name").eq("id", input.customerId).maybeSingle();
    const row = c as { email?: string | null; name?: string | null } | null;
    if (row?.email) {
      await sendTemplateEmail({
        to: row.email,
        templateId: "temperature-deviation",
        tenantId: input.tenantId,
        variables: { ...vars, customerName: row.name ?? "Customer" },
      });
    }
  }

  if (adminEmail) {
    await sendTemplateEmail({
      to: adminEmail,
      templateId: "temperature-deviation",
      tenantId: input.tenantId,
      variables: { ...vars, customerName: "Operations team" },
      force: true,
    });
  }
}
