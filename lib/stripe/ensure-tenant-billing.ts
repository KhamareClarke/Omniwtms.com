import { createAdminServiceClient } from "@/lib/supabase/admin-service";
import { createCustomer, createSubscription, hasStripeSecretKey } from "@/lib/stripe/client";

/**
 * Idempotent: ensures the license tenant has a Stripe customer and (when STRIPE_DEFAULT_PRICE_ID is set) a subscription.
 * Safe to call on every client signup — no duplicate customers or subscriptions.
 */
export async function ensureStripeBillingForTenant(
  tenantId: string,
  fallbackContactEmail: string
): Promise<{ ok: boolean; error?: string }> {
  if (!hasStripeSecretKey()) return { ok: true };

  const supabase = createAdminServiceClient();
  const { data: row, error } = await supabase
    .from("tenants")
    .select("id, name, admin_email, stripe_customer_id, stripe_subscription_id")
    .eq("id", tenantId)
    .maybeSingle();

  if (error || !row) return { ok: false, error: error?.message || "Tenant not found" };

  const t = row as {
    id: string;
    name?: string | null;
    admin_email?: string | null;
    stripe_customer_id?: string | null;
    stripe_subscription_id?: string | null;
  };

  const email = String(t.admin_email || "").trim() || fallbackContactEmail.trim();
  const name = String(t.name || "Organization").trim();

  try {
    if (!t.stripe_customer_id?.trim()) {
      await createCustomer(tenantId, name, email);
    }

    const priceId = process.env.STRIPE_DEFAULT_PRICE_ID?.trim();
    if (!priceId) return { ok: true };

    const { data: again } = await supabase
      .from("tenants")
      .select("stripe_customer_id, stripe_subscription_id")
      .eq("id", tenantId)
      .maybeSingle();
    const t2 = again as { stripe_customer_id?: string | null; stripe_subscription_id?: string | null } | null;
    const cid = t2?.stripe_customer_id?.trim();
    if (cid && !t2?.stripe_subscription_id?.trim()) {
      await createSubscription(cid, priceId, tenantId);
    }

    return { ok: true };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("ensureStripeBillingForTenant", e);
    return { ok: false, error: msg };
  }
}
