import { NextRequest, NextResponse } from "next/server";
import { createAdminServiceClient } from "@/lib/supabase/admin-service";
import { DEFAULT_TENANT_ID } from "@/lib/tenants/constants";
import { calculateOverageCharges, getUsageSnapshot, type BillingLimits } from "@/lib/billing/usage";

export async function GET(request: NextRequest) {
  try {
    const clientId = request.nextUrl.searchParams.get("client_id")?.trim();
    if (!clientId) return NextResponse.json({ error: "client_id required" }, { status: 400 });

    const supabase = createAdminServiceClient();
    const { data: client, error: cErr } = await supabase
      .from("clients")
      .select("tenant_id")
      .eq("id", clientId)
      .maybeSingle();
    if (cErr || !client) return NextResponse.json({ error: "Client not found" }, { status: 404 });
    const tenantId = (client as { tenant_id?: string | null }).tenant_id?.trim() || DEFAULT_TENANT_ID;

    const { data: tenant, error: tErr } = await supabase.from("tenants").select("*").eq("id", tenantId).maybeSingle();
    if (tErr || !tenant) return NextResponse.json({ error: "Tenant not found" }, { status: 404 });

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
      .select("id, period_start, period_end, total_amount_gbp, status, created_at, paid_at")
      .eq("tenant_id", tenantId)
      .order("created_at", { ascending: false })
      .limit(24);

    return NextResponse.json({
      tenant_id: tenantId,
      license_plan: tr.license_plan,
      monthly_cost: tr.monthly_cost,
      next_billing_date: tr.next_billing_date,
      stripe_customer_id: tr.stripe_customer_id,
      stripe_subscription_id: tr.stripe_subscription_id,
      stripe_price_id: tr.stripe_price_id,
      billing_cycle_day: tr.billing_cycle_day ?? 1,
      usage: {
        apiCalls: usage.apiCalls,
        storageGb: usage.storageGb,
        orders: usage.orders,
        deliveries: usage.deliveries,
      },
      overage,
      invoices: invoices ?? [],
    });
  } catch (e) {
    console.error("billing summary", e);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
