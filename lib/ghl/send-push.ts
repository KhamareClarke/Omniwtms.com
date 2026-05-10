import { ghlRequest } from "./client";
import type { GhlAuth } from "./types";

export type SendPushResult =
  | { ok: true; messageId?: string }
  | { ok: false; error: string; skipped?: boolean };

/**
 * GHL does not expose a single generic “mobile push” REST shape for all accounts.
 * We send a short SMS-style conversation ping when `userId` is a GHL contact id.
 * For real mobile pushes, use GHL Workflows + Mobile App in the GHL UI.
 */
export async function sendPushViaGHL(
  auth: GhlAuth,
  userId: string,
  title: string,
  body: string,
  link?: string
): Promise<SendPushResult> {
  const msg = [title, body, link].filter(Boolean).join(" — ").slice(0, 1600);
  try {
    const res = await ghlRequest(auth.apiKey, "/conversations/messages", {
      method: "POST",
      body: JSON.stringify({
        type: "SMS",
        contactId: userId,
        message: `[App] ${msg}`,
      }),
    });
    const raw = await res.text();
    if (!res.ok) return { ok: false, error: `${res.status}: ${raw}`, skipped: true };
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e), skipped: true };
  }
}
