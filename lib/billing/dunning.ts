import { createAdminServiceClient } from "@/lib/supabase/admin-service";
import { sendOverdueReminder } from "@/lib/billing/invoices";

const DAY_MS = 86400000;

/**
 * Open invoices older than 7 days → mark overdue and send escalating reminders (max level 3).
 */
export async function runOverdueInvoiceReminders(now: Date = new Date()): Promise<{ reminded: number }> {
  const supabase = createAdminServiceClient();
  const threshold = new Date(now.getTime() - 7 * DAY_MS).toISOString();
  const { data: rows, error } = await supabase
    .from("tenant_billing_invoices")
    .select("id, tenant_id, status, overdue_reminder_level, created_at")
    .in("status", ["open", "overdue"])
    .lt("created_at", threshold);
  if (error || !rows?.length) return { reminded: 0 };

  let reminded = 0;
  for (const inv of rows as Array<{
    id: string;
    tenant_id: string;
    status: string;
    overdue_reminder_level: number;
    created_at: string;
  }>) {
    const currentLevel = inv.overdue_reminder_level ?? 0;
    if (currentLevel >= 3) continue;
    const ageDays = (now.getTime() - new Date(inv.created_at).getTime()) / DAY_MS;
    const nextLevel = currentLevel + 1;
    if (ageDays < nextLevel * 7) continue;

    await supabase
      .from("tenant_billing_invoices")
      .update({
        status: "overdue",
        overdue_reminder_level: nextLevel,
        updated_at: now.toISOString(),
      })
      .eq("id", inv.id);

    await sendOverdueReminder(inv.tenant_id, inv.id, nextLevel);
    reminded += 1;
  }
  return { reminded };
}
