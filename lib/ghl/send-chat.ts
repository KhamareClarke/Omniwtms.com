import { ghlRequest } from "./client";
import type { GhlAuth } from "./types";

export type SendChatResult = { ok: true } | { ok: false; error: string };

export async function sendChatViaGHL(
  auth: GhlAuth,
  contactId: string,
  message: string
): Promise<SendChatResult> {
  try {
    let res = await ghlRequest(auth.apiKey, "/conversations/messages", {
      method: "POST",
      body: JSON.stringify({
        type: "Live_Chat",
        contactId,
        message,
      }),
    });
    let raw = await res.text();
    if (!res.ok) {
      res = await ghlRequest(auth.apiKey, "/conversations/messages", {
        method: "POST",
        body: JSON.stringify({
          type: "SMS",
          contactId,
          message: `[Chat] ${message}`.slice(0, 1600),
        }),
      });
      raw = await res.text();
      if (!res.ok) return { ok: false, error: `${res.status}: ${raw.slice(0, 400)}` };
    }
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) };
  }
}
