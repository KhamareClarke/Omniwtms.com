import { ghlRequest } from "./client";
import type { GhlAuth } from "./types";
import { findOrCreateContactByEmail } from "./contacts";

export type SendEmailGhlResult = { ok: true; messageId?: string } | { ok: false; error: string };

export async function sendEmailViaGHL(
  auth: GhlAuth,
  to: string,
  subject: string,
  bodyHtml: string,
  textBody?: string
): Promise<SendEmailGhlResult> {
  try {
    const contactId = await findOrCreateContactByEmail(auth, to);
    const res = await ghlRequest(auth.apiKey, "/conversations/messages", {
      method: "POST",
      body: JSON.stringify({
        type: "Email",
        contactId,
        subject,
        html: bodyHtml,
        message:
          textBody ??
          bodyHtml.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim().slice(0, 2000),
      }),
    });
    const raw = await res.text();
    if (!res.ok) return { ok: false, error: `${res.status}: ${raw}` };
    let messageId: string | undefined;
    try {
      const j = JSON.parse(raw) as { messageId?: string; id?: string };
      messageId = j.messageId ?? j.id;
    } catch {
      /* ignore */
    }
    return { ok: true, messageId };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) };
  }
}
