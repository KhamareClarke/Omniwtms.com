import { NextRequest, NextResponse } from "next/server";
import { createAdminServiceClient } from "@/lib/supabase/admin-service";
import { getVerifiedAdminFromRequest } from "@/lib/auth/require-admin-api";
import { getStripe, hasStripeSecretKey } from "@/lib/stripe/client";

type Ctx = { params: Promise<{ id: string }> };

export async function POST(request: NextRequest, context: Ctx) {
  const admin = await getVerifiedAdminFromRequest();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!hasStripeSecretKey()) return NextResponse.json({ error: "Stripe not configured" }, { status: 503 });

  const { id: tenantId } = await context.params;
  let body: { price_id?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const priceId = typeof body.price_id === "string" ? body.price_id.trim() : "";
  if (!priceId) return NextResponse.json({ error: "price_id required" }, { status: 400 });

  const supabase = createAdminServiceClient();
  const { data: tenant } = await supabase
    .from("tenants")
    .select("stripe_subscription_id")
    .eq("id", tenantId)
    .maybeSingle();
  const subId = String((tenant as { stripe_subscription_id?: string | null } | null)?.stripe_subscription_id || "").trim();
  if (!subId) return NextResponse.json({ error: "No stripe_subscription_id for tenant" }, { status: 400 });

  try {
    const stripe = getStripe();
    const sub = await stripe.subscriptions.retrieve(subId);
    const itemId = sub.items.data[0]?.id;
    if (!itemId) return NextResponse.json({ error: "Subscription has no items" }, { status: 400 });

    await stripe.subscriptions.update(subId, {
      items: [{ id: itemId, price: priceId }],
      proration_behavior: "create_prorations",
    });

    await supabase
      .from("tenants")
      .update({ stripe_price_id: priceId, updated_at: new Date().toISOString() })
      .eq("id", tenantId);

    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Plan update failed" },
      { status: 400 }
    );
  }
}
