import { SignJWT, jwtVerify } from "jose";

const COOKIE = "omniwtms_admin_session";

function getSecretKey(): Uint8Array {
  const s = process.env.ADMIN_SESSION_SECRET?.trim();
  if (!s || s.length < 32) {
    throw new Error("ADMIN_SESSION_SECRET must be set and at least 32 characters");
  }
  return new TextEncoder().encode(s);
}

export type AdminSessionPayload = {
  sub: string;
  email: string;
  typ: "admin";
};

export async function signAdminSession(payload: AdminSessionPayload, maxAgeSec: number): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(payload.sub)
    .setIssuedAt()
    .setExpirationTime(`${maxAgeSec}s`)
    .sign(getSecretKey());
}

export async function verifyAdminSessionToken(token: string): Promise<AdminSessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecretKey());
    const sub = typeof payload.sub === "string" ? payload.sub : "";
    const email = typeof payload.email === "string" ? payload.email : "";
    const typ = payload.typ;
    if (!sub || !email || typ !== "admin") return null;
    return { sub, email, typ: "admin" };
  } catch {
    return null;
  }
}

export const ADMIN_SESSION_COOKIE = COOKIE;
export const ADMIN_SESSION_MAX_AGE_SEC = 60 * 60 * 8;
