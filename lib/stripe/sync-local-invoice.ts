import { createAdminServiceClient } from "@/lib/supabase/admin-service";
import { getStripe, hasStripeSecretKey } from "@/lib/stripe/client";

/**
 * Creates a finalized Stripe invoice linked to our DB row via metadata `tenant_billing_invoice_id`.
 * Returns Stripe invoice id, or null if skipped / failed.
 */
export async function createStripeInvoiceForLocalRow(params: {
  tenantId: string;
  localInvoiceId: string;
  stripeCustomerId: string;
  amountGbp: number;
  description: string;
}): Promise<string | null> {
  if (!hasStripeSecretKey()) return null;
  const amountPence = Math.round(params.amountGbp * 100);
  if (amountPence <= 0) return null;

  try {
    const stripe = getStripe();
    const inv = await stripe.invoices.create({
      customer: params.stripeCustomerId,
      currency: "gbp",
      collection_method: "charge_automatically",
      auto_advance: false,
      metadata: {
        tenant_billing_invoice_id: params.localInvoiceId,
        tenant_id: params.tenantId,
      },
    });

    await stripe.invoiceItems.create({
      customer: params.stripeCustomerId,
      invoice: inv.id,
      currency: "gbp",
      amount: amountPence,
      description: params.description.slice(0, 200),
    });

    const finalized = await stripe.invoices.finalizeInvoice(inv.id, { auto_advance: true });

    const supabase = createAdminServiceClient();
    await supabase
      .from("tenant_billing_invoices")
      .update({
        stripe_invoice_id: finalized.id,
        updated_at: new Date().toISOString(),
      })
      .eq("id", params.localInvoiceId);

    return finalized.id;
  } catch (e) {
    console.error("createStripeInvoiceForLocalRow", e);
    return null;
  }
}
