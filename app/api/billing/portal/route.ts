import { NextRequest, NextResponse } from "next/server";
import { createAdminServiceClient } from "@/lib/supabase/admin-service";
import { DEFAULT_TENANT_ID } from "@/lib/tenants/constants";
import { createBillingPortalSession } from "@/lib/stripe/portal";
import { hasStripeSecretKey } from "@/lib/stripe/client";

export async function POST(request: NextRequest) {
  try {
    if (!hasStripeSecretKey()) {
      return NextResponse.json({ error: "Stripe is not configured" }, { status: 503 });
    }
    const body = await request.json();
    const clientId = typeof body.client_id === "string" ? body.client_id.trim() : "";
    if (!clientId) return NextResponse.json({ error: "client_id required" }, { status: 400 });

    const supabase = createAdminServiceClient();
    const { data: client } = await supabase.from("clients").select("tenant_id").eq("id", clientId).maybeSingle();
    const tenantId = (client as { tenant_id?: string | null } | null)?.tenant_id?.trim() || DEFAULT_TENANT_ID;

    const { data: tenant } = await supabase
      .from("tenants")
      .select("stripe_customer_id")
      .eq("id", tenantId)
      .maybeSingle();
    const cid = String((tenant as { stripe_customer_id?: string | null } | null)?.stripe_customer_id || "").trim();
    if (!cid) return NextResponse.json({ error: "No Stripe customer on file" }, { status: 400 });

    const base = process.env.NEXT_PUBLIC_APP_URL?.trim() || "http://localhost:3000";
    const returnUrl = typeof body.return_url === "string" && body.return_url.startsWith("http") ? body.return_url : `${base}/settings/billing`;

    const { url } = await createBillingPortalSession(cid, returnUrl);
    return NextResponse.json({ url });
  } catch (e) {
    console.error("billing portal", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to create portal session" },
      { status: 500 }
    );
  }
}
