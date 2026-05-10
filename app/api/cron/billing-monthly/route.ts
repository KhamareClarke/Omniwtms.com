import { NextRequest, NextResponse } from "next/server";
import { createAdminServiceClient } from "@/lib/supabase/admin-service";
import { createMonthlyInvoice } from "@/lib/billing/invoices";
import { runOverdueInvoiceReminders } from "@/lib/billing/dunning";
import { rejectUnauthorizedCron } from "@/lib/billing/cron-auth";

async function runBillingMonthly(): Promise<{
  ok: boolean;
  invoices: number;
  results: { tenantId: string; ok: boolean; error?: string; invoiceId?: string }[];
  overdue_reminders: number;
}> {
  const supabase = createAdminServiceClient();
  const { data: tenants, error } = await supabase
    .from("tenants")
    .select("id, billing_cycle_day, status, deleted_at")
    .is("deleted_at", null)
    .in("status", ["active", "trial"]);

  if (error) {
    throw new Error(error.message);
  }

  const todayUtc = new Date().getUTCDate();
  const results: { tenantId: string; ok: boolean; error?: string; invoiceId?: string }[] = [];

  for (const t of tenants ?? []) {
    const row = t as { id: string; billing_cycle_day?: number | null };
    const cycleDay = row.billing_cycle_day ?? 1;
    if (cycleDay !== todayUtc) continue;
    const r = await createMonthlyInvoice(row.id);
    results.push({ tenantId: row.id, ok: r.ok, error: r.error, invoiceId: r.invoiceId });
  }

  const overdue = await runOverdueInvoiceReminders();

  return {
    ok: true,
    invoices: results.length,
    results,
    overdue_reminders: overdue.reminded,
  };
}

/**
 * GET/POST /api/cron/billing-monthly
 * Vercel Cron uses GET. Optional Authorization: Bearer CRON_SECRET when CRON_SECRET is set.
 */
export async function GET(request: NextRequest) {
  const denied = rejectUnauthorizedCron(request);
  if (denied) return denied;
  try {
    return NextResponse.json(await runBillingMonthly());
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Failed" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const denied = rejectUnauthorizedCron(request);
  if (denied) return denied;
  try {
    return NextResponse.json(await runBillingMonthly());
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Failed" }, { status: 500 });
  }
}
