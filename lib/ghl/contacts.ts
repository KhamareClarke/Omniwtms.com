import { ghlRequest } from "./client";
import type { GhlAuth } from "./types";

/** Find contact by phone, or create under location. */
export async function findOrCreateContactByPhone(
  auth: GhlAuth,
  phone: string
): Promise<string> {
  const normalized = phone.replace(/\s+/g, "");
  const dup = await ghlRequest(
    auth.apiKey,
    `/contacts/search/duplicate?locationId=${encodeURIComponent(auth.locationId)}&number=${encodeURIComponent(normalized)}`
  );
  if (dup.ok) {
    const j = (await dup.json().catch(() => null)) as { contact?: { id?: string } } | null;
    if (j?.contact?.id) return j.contact.id;
  }
  const create = await ghlRequest(auth.apiKey, "/contacts/", {
    method: "POST",
    body: JSON.stringify({
      locationId: auth.locationId,
      phone: normalized,
      name: "OmniWTMS contact",
      tags: ["omniwtms"],
    }),
  });
  const text = await create.text();
  if (!create.ok) throw new Error(`GHL create contact: ${create.status} ${text}`);
  const cj = JSON.parse(text) as { contact?: { id?: string }; id?: string };
  const id = cj?.contact?.id ?? cj?.id;
  if (!id) throw new Error("GHL create contact: missing id");
  return id;
}

/** Find contact by email, or create. */
export async function findOrCreateContactByEmail(
  auth: GhlAuth,
  email: string
): Promise<string> {
  const e = email.trim().toLowerCase();
  const dup = await ghlRequest(
    auth.apiKey,
    `/contacts/search/duplicate?locationId=${encodeURIComponent(auth.locationId)}&email=${encodeURIComponent(e)}`
  );
  if (dup.ok) {
    const j = (await dup.json().catch(() => null)) as { contact?: { id?: string } } | null;
    if (j?.contact?.id) return j.contact.id;
  }
  const create = await ghlRequest(auth.apiKey, "/contacts/", {
    method: "POST",
    body: JSON.stringify({
      locationId: auth.locationId,
      email: e,
      name: e.split("@")[0] || "Contact",
      tags: ["omniwtms-email"],
    }),
  });
  const text = await create.text();
  if (!create.ok) throw new Error(`GHL create contact: ${create.status} ${text}`);
  const cj = JSON.parse(text) as { contact?: { id?: string }; id?: string };
  const id = cj?.contact?.id ?? cj?.id;
  if (!id) throw new Error("GHL create contact: missing id");
  return id;
}
