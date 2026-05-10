import { NextRequest, NextResponse } from "next/server";
import { getVerifiedAdminFromRequest } from "@/lib/auth/require-admin-api";
import { issueRefund, hasStripeSecretKey } from "@/lib/stripe/client";

type Ctx = { params: Promise<{ id: string }> };

export async function POST(request: NextRequest, _context: Ctx) {
  const admin = await getVerifiedAdminFromRequest();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!hasStripeSecretKey()) return NextResponse.json({ error: "Stripe not configured" }, { status: 503 });

  let body: { payment_intent?: string; amount?: number };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const pi = typeof body.payment_intent === "string" ? body.payment_intent.trim() : "";
  if (!pi) return NextResponse.json({ error: "payment_intent required" }, { status: 400 });

  try {
    const refund = await issueRefund({
      stripePaymentIntentId: pi,
      amount: typeof body.amount === "number" && body.amount > 0 ? body.amount : undefined,
    });
    return NextResponse.json({ ok: true, refund_id: refund.id, status: refund.status });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Refund failed" },
      { status: 400 }
    );
  }
}
