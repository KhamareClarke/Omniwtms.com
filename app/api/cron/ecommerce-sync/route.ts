import { NextRequest, NextResponse } from "next/server";
import { rejectUnauthorizedCron } from "@/lib/billing/cron-auth";
import { runHourlyEcommerceSyncAllTenants } from "@/lib/ecommerce/sync-scheduler";

/**
 * GET/POST /api/cron/ecommerce-sync
 * Hourly sync for connected e-commerce stores (Vercel Cron).
 */
export async function GET(request: NextRequest) {
  const denied = rejectUnauthorizedCron(request);
  if (denied) return denied;
  try {
    return NextResponse.json(await runHourlyEcommerceSyncAllTenants());
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Failed" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const denied = rejectUnauthorizedCron(request);
  if (denied) return denied;
  try {
    return NextResponse.json(await runHourlyEcommerceSyncAllTenants());
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Failed" }, { status: 500 });
  }
}
