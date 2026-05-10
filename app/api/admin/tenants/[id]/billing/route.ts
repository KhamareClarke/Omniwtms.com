import { NextRequest, NextResponse } from "next/server";
import { createAdminServiceClient } from "@/lib/supabase/admin-service";
import { getVerifiedAdminFromRequest } from "@/lib/auth/require-admin-api";
import { calculateOverageCharges, getUsageSnapshot, type BillingLimits } from "@/lib/billing/usage";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, context: Ctx) {
  const admin = await getVerifiedAdminFromRequest();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: tenantId } = await context.params;
  const supabase = createAdminServiceClient();

  const { data: clientRow } = await supabase.from("clients").select("id").eq("id", tenantId).maybeSingle();
  if (clientRow) {
    return NextResponse.json({ error: "Billing detail is only for license tenants" }, { status: 400 });
  }

  const { data: tenant, error: tErr } = await supabase.from("tenants").select("*").eq("id", tenantId).maybeSingle();
  if (tErr || !tenant) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const usage = await getUsageSnapshot(tenantId);
  const tr = tenant as Record<string, unknown>;
  const limits: BillingLimits = {
    max_api_calls_per_month: (tr.max_api_calls_per_month as number | null) ?? null,
    max_storage_gb: (tr.max_storage_gb as number | null) ?? null,
    max_orders_per_month: (tr.max_orders_per_month as number | null) ?? null,
    max_deliveries_per_month: null,
  };
  const overage = calculateOverageCharges(
    {
      apiCalls: usage.apiCalls,
      storageGb: usage.storageGb,
      orders: usage.orders,
      deliveries: usage.deliveries,
    },
    limits
  );

  const { data: invoices } = await supabase
    .from("tenant_billing_invoices")
    .select("id, period_start, period_end, total_amount_gbp, status, created_at, paid_at, stripe_invoice_id")
    .eq("tenant_id", tenantId)
    .order("created_at", { ascending: false })
    .limit(36);

  return NextResponse.json({
    tenant: {
      license_plan: tr.license_plan,
      monthly_cost: tr.monthly_cost,
      next_billing_date: tr.next_billing_date,
      stripe_customer_id: tr.stripe_customer_id,
      stripe_subscription_id: tr.stripe_subscription_id,
      stripe_price_id: tr.stripe_price_id,
      billing_cycle_day: tr.billing_cycle_day ?? 1,
    },
    usage: {
      apiCalls: usage.apiCalls,
      storageGb: usage.storageGb,
      orders: usage.orders,
      deliveries: usage.deliveries,
    },
    overage,
    invoices: invoices ?? [],
  });
}
