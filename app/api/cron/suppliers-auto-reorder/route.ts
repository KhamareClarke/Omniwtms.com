import { NextRequest, NextResponse } from "next/server";
import { createAdminServiceClient } from "@/lib/supabase/admin-service";
import { autoCreatePOsForLowStock } from "@/lib/suppliers/create-po";
import { rejectUnauthorizedCron } from "@/lib/billing/cron-auth";

async function run(): Promise<{ ok: boolean; processed: number; created: number }> {
  const supabase = createAdminServiceClient();
  const { data: tenants, error } = await supabase
    .from("tenants")
    .select("id")
    .is("deleted_at", null)
    .in("status", ["active", "trial"]);
  if (error) throw new Error(error.message);
  let created = 0;
  let processed = 0;
  for (const t of (tenants ?? []) as { id: string }[]) {
    const r = await autoCreatePOsForLowStock(t.id);
    processed += 1;
    created += r.created;
  }
  return { ok: true, processed, created };
}

export async function GET(request: NextRequest) {
  const denied = rejectUnauthorizedCron(request);
  if (denied) return denied;
  try {
    return NextResponse.json(await run());
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Failed" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const denied = rejectUnauthorizedCron(request);
  if (denied) return denied;
  try {
    return NextResponse.json(await run());
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Failed" }, { status: 500 });
  }
}
