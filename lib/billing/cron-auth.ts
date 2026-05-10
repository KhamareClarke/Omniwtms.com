import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

/** When CRON_SECRET is set, require Authorization: Bearer <CRON_SECRET> (Vercel Cron supplies this automatically). */
export function rejectUnauthorizedCron(request: NextRequest): NextResponse | null {
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret) return null;
  const auth = request.headers.get("authorization")?.trim();
  if (auth === `Bearer ${secret}`) return null;
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}
