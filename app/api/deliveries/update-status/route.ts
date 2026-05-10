import { NextRequest, NextResponse } from "next/server";

/**
 * POST /api/deliveries/update-status
 * Forwards to /api/notify-delivery-status (same body: delivery_id, new_status, …).
 */
export async function POST(request: NextRequest) {
  const origin = request.nextUrl.origin;
  const bodyText = await request.text();
  const res = await fetch(`${origin}/api/notify-delivery-status`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: bodyText,
  });
  const text = await res.text();
  return new NextResponse(text, {
    status: res.status,
    headers: { "Content-Type": res.headers.get("content-type") || "application/json" },
  });
}
