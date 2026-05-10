import { getGhlCredentialsForTenant } from "@/lib/ghl/credentials";

/**
 * Transactional email: SMTP (Gmail) or Go High Level when USE_GHL_EMAIL=true.
 */
export type EmailTransport = "smtp" | "ghl";

export function useGhlEmail(): boolean {
  const v = process.env.USE_GHL_EMAIL?.trim().toLowerCase();
  return v === "true" || v === "1" || v === "yes";
}

export function getEmailConfig() {
  return {
    transport: (useGhlEmail() ? "ghl" : "smtp") as EmailTransport,
    assertConfigured(): void {
      if (useGhlEmail()) {
        const k = process.env.GHL_API_KEY?.trim();
        const loc = process.env.GHL_LOCATION_ID?.trim();
        if (!k || !loc) {
          throw new Error(
            "USE_GHL_EMAIL is set: configure GHL_API_KEY and GHL_LOCATION_ID (or tenant ghl_* in DB)."
          );
        }
        return;
      }
      const user = process.env.EMAIL_USER?.trim();
      const pass = process.env.EMAIL_PASS?.replace(/\s+/g, "");
      if (!user || !pass) {
        throw new Error("EMAIL_USER and EMAIL_PASS must be set for SMTP, or set USE_GHL_EMAIL=true with GHL keys.");
      }
    },
    /** True if env-level GHL keys or SMTP creds exist. Tenant-only GHL keys need {@link isEmailOutgoingConfigured}. */
    isConfigured(): boolean {
      if (useGhlEmail()) {
        return Boolean(process.env.GHL_API_KEY?.trim() && process.env.GHL_LOCATION_ID?.trim());
      }
      return Boolean(process.env.EMAIL_USER?.trim() && process.env.EMAIL_PASS?.replace(/\s+/g, ""));
    },
  };
}

/** Resolves tenant DB + env so tenant-stored GHL keys count when USE_GHL_EMAIL=true. */
export async function isEmailOutgoingConfigured(tenantId?: string | null): Promise<boolean> {
  if (!useGhlEmail()) {
    const user = process.env.EMAIL_USER?.trim();
    const pass = process.env.EMAIL_PASS?.replace(/\s+/g, "");
    return Boolean(user && pass);
  }
  const auth = await getGhlCredentialsForTenant(tenantId ?? null);
  return Boolean(auth);
}
