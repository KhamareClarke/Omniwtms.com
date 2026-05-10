import { NextRequest, NextResponse } from "next/server";
import { constructStripeWebhookEvent, handleWebhook } from "@/lib/stripe/client";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const sig = request.headers.get("stripe-signature");
    const raw = await request.text();
    const event = constructStripeWebhookEvent(raw, sig);
    await handleWebhook(event);
    return NextResponse.json({ received: true });
  } catch (e) {
    console.error("stripe webhook", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Webhook error" },
      { status: 400 }
    );
  }
}
