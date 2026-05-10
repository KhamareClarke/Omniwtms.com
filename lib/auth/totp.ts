import { createHmac, randomInt, timingSafeEqual } from "crypto";

/**
 * Email-delivered login codes (no authenticator app).
 * Codes are hashed with HMAC-SHA256 using ADMIN_OTP_HMAC_SECRET before storage.
 */

export const LOGIN_CODE_LENGTH = 6;
export const LOGIN_CODE_TTL_MS = 10 * 60 * 1000;

function getOtpSecret(): string {
  const s = process.env.ADMIN_OTP_HMAC_SECRET?.trim();
  if (!s || s.length < 16) {
    throw new Error("ADMIN_OTP_HMAC_SECRET must be set and at least 16 characters");
  }
  return s;
}

/** Numeric login code as string (e.g. "039482"). */
export function generateLoginCode(): string {
  const n = randomInt(0, 10 ** LOGIN_CODE_LENGTH);
  return n.toString().padStart(LOGIN_CODE_LENGTH, "0");
}

export function hashLoginCode(code: string): string {
  const normalized = code.replace(/\s/g, "");
  return createHmac("sha256", getOtpSecret()).update(normalized, "utf8").digest("hex");
}

export function verifyLoginCode(code: string, storedHash: string): boolean {
  const normalized = code.replace(/\s/g, "");
  if (!/^\d+$/.test(normalized) || normalized.length !== LOGIN_CODE_LENGTH) return false;
  const h = hashLoginCode(normalized);
  try {
    return timingSafeEqual(Buffer.from(h, "utf8"), Buffer.from(storedHash, "utf8"));
  } catch {
    return false;
  }
}

/** Split env list: ADMIN_OTP_RECIPIENTS=a@x.com,b@y.com */
export function getAdminOtpRecipients(): string[] {
  const raw = process.env.ADMIN_OTP_RECIPIENTS?.trim();
  if (!raw) {
    throw new Error("ADMIN_OTP_RECIPIENTS must list at least one email");
  }
  return raw
    .split(/[,;\s]+/)
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}
