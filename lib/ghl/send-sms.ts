import { ghlRequest } from "./client";
import type { GhlAuth } from "./types";
import { findOrCreateContactByPhone } from "./contacts";

export type SendSmsResult = { ok: true; messageId?: string } | { ok: false; error: string };

export async function sendSMSViaGHL(
  auth: GhlAuth,
  phoneNumber: string,
  message: string
): Promise<SendSmsResult> {
  try {
    const contactId = await findOrCreateContactByPhone(auth, phoneNumber);
    const body = message.length > 1600 ? `${message.slice(0, 1597)}...` : message;
    const res = await ghlRequest(auth.apiKey, "/conversations/messages", {
      method: "POST",
      body: JSON.stringify({
        type: "SMS",
        contactId,
        message: body,
      }),
    });
    const text = await res.text();
    if (!res.ok) return { ok: false, error: `${res.status}: ${text}` };
    let messageId: string | undefined;
    try {
      const j = JSON.parse(text) as { messageId?: string; id?: string };
      messageId = j.messageId ?? j.id;
    } catch {
      /* ignore */
    }
    return { ok: true, messageId };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) };
  }
}
