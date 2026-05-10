import Stripe from "stripe";
import { createAdminServiceClient } from "@/lib/supabase/admin-service";

const API_VERSION: Stripe.LatestApiVersion = "2024-11-20.acacia";

export function getStripe(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY?.trim();
  if (!key) throw new Error("STRIPE_SECRET_KEY is not configured");
  return new Stripe(key, { apiVersion: API_VERSION });
}

export function hasStripeSecretKey(): boolean {
  return Boolean(process.env.STRIPE_SECRET_KEY?.trim());
}

/** Webhook endpoint verification (needs signing secret). */
export function isStripeWebhookConfigured(): boolean {
  return Boolean(process.env.STRIPE_SECRET_KEY?.trim() && process.env.STRIPE_WEBHOOK_SECRET?.trim());
}

export function constructStripeWebhookEvent(payload: string | Buffer, signature: string | null): Stripe.Event {
  const secret = process.env.STRIPE_WEBHOOK_SECRET?.trim();
  if (!secret) throw new Error("STRIPE_WEBHOOK_SECRET is not configured");
  if (!signature) throw new Error("Missing stripe-signature header");
  return getStripe().webhooks.constructEvent(payload, signature, secret);
}

/**
 * Creates a Stripe customer and persists `stripe_customer_id` on the tenant row.
 */
export async function createCustomer(
  tenantId: string,
  tenantName: string,
  email: string | null
): Promise<Stripe.Customer> {
  const stripe = getStripe();
  const customer = await stripe.customers.create({
    name: tenantName.trim(),
    email: email?.trim() || undefined,
    metadata: { tenant_id: tenantId },
  });

  const supabase = createAdminServiceClient();
  const { error } = await supabase
    .from("tenants")
    .update({ stripe_customer_id: customer.id, updated_at: new Date().toISOString() })
    .eq("id", tenantId);
  if (error) throw new Error(error.message);
  return customer;
}

/**
 * Creates a monthly subscription and stores ids on the tenant.
 */
export async function createSubscription(
  stripeCustomerId: string,
  planPriceId: string,
  tenantId: string
): Promise<Stripe.Subscription> {
  const stripe = getStripe();
  const subscription = await stripe.subscriptions.create({
    customer: stripeCustomerId,
    items: [{ price: planPriceId }],
    metadata: { tenant_id: tenantId },
  });

  const supabase = createAdminServiceClient();
  const { error } = await supabase
    .from("tenants")
    .update({
      stripe_subscription_id: subscription.id,
      stripe_price_id: planPriceId,
      updated_at: new Date().toISOString(),
    })
    .eq("id", tenantId);
  if (error) throw new Error(error.message);
  return subscription;
}

export async function issueRefund(params: {
  stripePaymentIntentId: string;
  /** Amount in smallest currency unit (e.g. pence); omit for full refund. */
  amount?: number;
}): Promise<Stripe.Refund> {
  const stripe = getStripe();
  return stripe.refunds.create({
    payment_intent: params.stripePaymentIntentId,
    amount: params.amount,
  });
}

async function tenantIdFromStripeCustomer(customerId: string): Promise<string | null> {
  const supabase = createAdminServiceClient();
  const { data } = await supabase.from("tenants").select("id").eq("stripe_customer_id", customerId).maybeSingle();
  return (data as { id?: string } | null)?.id ?? null;
}

async function markTenantInvoicePaidFromStripe(inv: Stripe.Invoice): Promise<void> {
  const supabase = createAdminServiceClient();
  const ourId = inv.metadata?.tenant_billing_invoice_id?.trim();
  if (ourId) {
    await supabase
      .from("tenant_billing_invoices")
      .update({
        status: "paid",
        paid_at: new Date().toISOString(),
        stripe_invoice_id: inv.id,
        updated_at: new Date().toISOString(),
      })
      .eq("id", ourId);
    return;
  }

  const { data: byStripe } = await supabase
    .from("tenant_billing_invoices")
    .select("id")
    .eq("stripe_invoice_id", inv.id)
    .maybeSingle();
  if (byStripe) {
    await supabase
      .from("tenant_billing_invoices")
      .update({
        status: "paid",
        paid_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", (byStripe as { id: string }).id);
    return;
  }

  const cust = typeof inv.customer === "string" ? inv.customer : inv.customer?.id;
  if (!cust) return;
  const tid = await tenantIdFromStripeCustomer(cust);
  if (tid) await markLatestOpenInvoicePaidFallback(tid, inv.id);
}

async function markLatestOpenInvoicePaidFallback(tenantId: string, stripeInvoiceId: string): Promise<void> {
  const supabase = createAdminServiceClient();
  const { data: row } = await supabase
    .from("tenant_billing_invoices")
    .select("id")
    .eq("tenant_id", tenantId)
    .eq("status", "open")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (!row) return;
  await supabase
    .from("tenant_billing_invoices")
    .update({
      status: "paid",
      paid_at: new Date().toISOString(),
      stripe_invoice_id: stripeInvoiceId,
      updated_at: new Date().toISOString(),
    })
    .eq("id", (row as { id: string }).id);
}

async function markTenantInvoiceOverdueFromStripe(inv: Stripe.Invoice): Promise<void> {
  const supabase = createAdminServiceClient();
  const ourId = inv.metadata?.tenant_billing_invoice_id?.trim();
  if (ourId) {
    await supabase
      .from("tenant_billing_invoices")
      .update({ status: "overdue", updated_at: new Date().toISOString() })
      .eq("id", ourId);
    return;
  }
  const { data: byStripe } = await supabase
    .from("tenant_billing_invoices")
    .select("id")
    .eq("stripe_invoice_id", inv.id)
    .maybeSingle();
  if (byStripe) {
    await supabase
      .from("tenant_billing_invoices")
      .update({ status: "overdue", updated_at: new Date().toISOString() })
      .eq("id", (byStripe as { id: string }).id);
    return;
  }
  const cust = typeof inv.customer === "string" ? inv.customer : inv.customer?.id;
  if (!cust) return;
  const tid = await tenantIdFromStripeCustomer(cust);
  if (tid) await markLatestOpenInvoiceOverdueFallback(tid);
}

async function markLatestOpenInvoiceOverdueFallback(tenantId: string): Promise<void> {
  const supabase = createAdminServiceClient();
  const { data: row } = await supabase
    .from("tenant_billing_invoices")
    .select("id")
    .eq("tenant_id", tenantId)
    .in("status", ["open", "draft"])
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (!row) return;
  await supabase
    .from("tenant_billing_invoices")
    .update({ status: "overdue", updated_at: new Date().toISOString() })
    .eq("id", (row as { id: string }).id);
}

async function syncSubscriptionPeriodToTenant(subscription: Stripe.Subscription): Promise<void> {
  const tenantId = subscription.metadata?.tenant_id;
  if (!tenantId) {
    const c = typeof subscription.customer === "string" ? subscription.customer : subscription.customer?.id;
    if (!c) return;
    const resolved = await tenantIdFromStripeCustomer(c);
    if (!resolved) return;
    await patchTenantBillingDates(resolved, subscription);
    return;
  }
  await patchTenantBillingDates(tenantId, subscription);
}

async function patchTenantBillingDates(tenantId: string, subscription: Stripe.Subscription): Promise<void> {
  const end = subscription.current_period_end;
  if (!end) return;
  const d = new Date(end * 1000);
  const isoDate = d.toISOString().slice(0, 10);
  const supabase = createAdminServiceClient();
  await supabase
    .from("tenants")
    .update({
      stripe_subscription_id: subscription.id,
      next_billing_date: isoDate,
      updated_at: new Date().toISOString(),
    })
    .eq("id", tenantId);
}

/**
 * Route Stripe webhook events to tenant / invoice updates.
 * Handles: payment_intent.succeeded, invoice.payment_failed, invoice.paid, customer.subscription.updated, subscription_schedule.updated
 */
export async function handleWebhook(event: Stripe.Event): Promise<void> {
  switch (event.type) {
    case "payment_intent.succeeded": {
      const pi = event.data.object as Stripe.PaymentIntent;
      const invRef = pi.invoice;
      if (invRef && typeof invRef !== "string") {
        await markTenantInvoicePaidFromStripe(invRef);
      }
      break;
    }
    case "invoice.paid": {
      const inv = event.data.object as Stripe.Invoice;
      await markTenantInvoicePaidFromStripe(inv);
      break;
    }
    case "invoice.payment_failed": {
      const inv = event.data.object as Stripe.Invoice;
      await markTenantInvoiceOverdueFromStripe(inv);
      break;
    }
    case "customer.subscription.updated":
    case "customer.subscription.created": {
      const sub = event.data.object as Stripe.Subscription;
      await syncSubscriptionPeriodToTenant(sub);
      break;
    }
    case "subscription_schedule.updated": {
      try {
        const sched = event.data.object as Stripe.SubscriptionSchedule;
        const subRef = sched.subscription;
        const subId = typeof subRef === "string" ? subRef : subRef && "id" in subRef ? subRef.id : null;
        if (!subId) break;
        const stripe = getStripe();
        const sub = await stripe.subscriptions.retrieve(subId);
        await syncSubscriptionPeriodToTenant(sub);
      } catch (e) {
        console.error("subscription_schedule.updated", e);
      }
      break;
    }
    default:
      break;
  }
}
