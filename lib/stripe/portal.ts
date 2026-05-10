import { getStripe } from "@/lib/stripe/client";

export async function createBillingPortalSession(
  stripeCustomerId: string,
  returnUrl: string
): Promise<{ url: string }> {
  const stripe = getStripe();
  const session = await stripe.billingPortal.sessions.create({
    customer: stripeCustomerId,
    return_url: returnUrl,
  });
  return { url: session.url };
}
