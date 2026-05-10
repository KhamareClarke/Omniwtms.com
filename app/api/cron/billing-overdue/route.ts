import { NextRequest, NextResponse } from "next/server";
import { runOverdueInvoiceReminders } from "@/lib/billing/dunning";
import { rejectUnauthorizedCron } from "@/lib/billing/cron-auth";

/**
 * GET/POST /api/cron/billing-overdue
 * Vercel Cron uses GET. Optional Authorization: Bearer CRON_SECRET when CRON_SECRET is set.
 */
export async function GET(request: NextRequest) {
  const denied = rejectUnauthorizedCron(request);
  if (denied) return denied;
  const r = await runOverdueInvoiceReminders();
  return NextResponse.json({ ok: true, reminded: r.reminded });
}

export async function POST(request: NextRequest) {
  const denied = rejectUnauthorizedCron(request);
  if (denied) return denied;
  const r = await runOverdueInvoiceReminders();
  return NextResponse.json({ ok: true, reminded: r.reminded });
}
