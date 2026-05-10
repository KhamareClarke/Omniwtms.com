import bcrypt from "bcrypt";
import { createAdminServiceClient } from "@/lib/supabase/admin-service";
import {
  generateLoginCode,
  getAdminOtpRecipients,
  hashLoginCode,
  LOGIN_CODE_TTL_MS,
  verifyLoginCode,
} from "@/lib/auth/totp";
import { sendEmail, brandedEmailHtml } from "@/lib/email";

const BCRYPT_ROUNDS = 12;
const MAX_FAILED = 5;
const LOCK_MINUTES = 30;

export type AdminRow = {
  id: string;
  email: string;
  name: string | null;
  status: string;
  password: string | null;
  password_hash: string | null;
  failed_login_attempts: number;
  locked_until: string | null;
};

export async function findAdminByEmail(email: string): Promise<AdminRow | null> {
  const supabase = createAdminServiceClient();
  const normalized = email.trim().toLowerCase();
  const { data, error } = await supabase
    .from("admins")
    .select(
      "id, email, name, status, password, password_hash, failed_login_attempts, locked_until"
    )
    .eq("email", normalized)
    .maybeSingle();
  if (error || !data) return null;
  return data as AdminRow;
}

export function isAccountLocked(admin: AdminRow): boolean {
  if (admin.status === "locked") return true;
  if (!admin.locked_until) return false;
  return new Date(admin.locked_until) > new Date();
}

export async function verifyAdminPassword(admin: AdminRow, plainPassword: string): Promise<boolean> {
  const hash = admin.password_hash?.trim();
  if (hash && hash.startsWith("$2")) {
    try {
      if (await bcrypt.compare(plainPassword, hash)) return true;
    } catch {
      /* malformed hash in DB — fall through to legacy password if present */
    }
  }
  if (admin.password != null && admin.password === plainPassword) {
    return true;
  }
  return false;
}

/** Store bcrypt hash and clear legacy `password` when missing, invalid, or not matching. */
export async function upgradeLegacyPasswordIfNeeded(
  adminId: string,
  plainPassword: string,
  admin: AdminRow
): Promise<void> {
  const stored = admin.password_hash?.trim();
  if (stored?.startsWith("$2")) {
    try {
      if (await bcrypt.compare(plainPassword, stored)) return;
    } catch {
      /* replace malformed hash */
    }
  }
  const supabase = createAdminServiceClient();
  const hash = await bcrypt.hash(plainPassword, BCRYPT_ROUNDS);
  await supabase
    .from("admins")
    .update({ password_hash: hash, password: null, updated_at: new Date().toISOString() })
    .eq("id", adminId);
}

export async function recordFailedLoginAttempt(adminId: string, prev: number): Promise<void> {
  const supabase = createAdminServiceClient();
  const next = prev + 1;
  const patch: Record<string, unknown> = {
    failed_login_attempts: next,
    updated_at: new Date().toISOString(),
  };
  if (next >= MAX_FAILED) {
    const until = new Date(Date.now() + LOCK_MINUTES * 60 * 1000).toISOString();
    patch.locked_until = until;
    patch.status = "locked";
  }
  await supabase.from("admins").update(patch).eq("id", adminId);
}

export async function resetFailedLoginAttempts(adminId: string): Promise<void> {
  const supabase = createAdminServiceClient();
  await supabase
    .from("admins")
    .update({
      failed_login_attempts: 0,
      locked_until: null,
      status: "active",
      updated_at: new Date().toISOString(),
    })
    .eq("id", adminId);
}

export async function recordSuccessfulLogin(adminId: string): Promise<void> {
  const supabase = createAdminServiceClient();
  await supabase
    .from("admins")
    .update({
      last_login: new Date().toISOString(),
      failed_login_attempts: 0,
      locked_until: null,
      status: "active",
      updated_at: new Date().toISOString(),
    })
    .eq("id", adminId);
}

export async function createLoginChallenge(adminId: string): Promise<{ id: string; plainCode: string }> {
  const supabase = createAdminServiceClient();
  const plainCode = generateLoginCode();
  const codeHash = hashLoginCode(plainCode);
  const expiresAt = new Date(Date.now() + LOGIN_CODE_TTL_MS).toISOString();
  const { data, error } = await supabase
    .from("admin_login_challenges")
    .insert({
      admin_id: adminId,
      code_hash: codeHash,
      expires_at: expiresAt,
    })
    .select("id")
    .single();
  if (error || !data?.id) {
    throw new Error("Could not create login challenge");
  }
  return { id: data.id as string, plainCode };
}

export async function sendAdminLoginOtpEmail(params: {
  code: string;
  adminEmail: string;
  adminName: string | null;
}): Promise<void> {
  const recipients = getAdminOtpRecipients();
  const html = brandedEmailHtml(
    `
    <p><strong>Admin sign-in verification</strong></p>
    <p>Someone signed in to OmniWTMS admin using <strong>${escapeHtml(params.adminEmail)}</strong>.</p>
    <p>Your one-time code is:</p>
    <p style="font-size:28px;letter-spacing:6px;font-weight:700;">${escapeHtml(params.code)}</p>
    <p>This code expires in ${Math.round(LOGIN_CODE_TTL_MS / 60000)} minutes. If you did not attempt this login, secure the account immediately.</p>
    `,
    "Admin verification code"
  );
  await sendEmail({
    to: recipients,
    subject: `OmniWTMS admin code: ${params.code}`,
    html,
    text: `Admin OTP for ${params.adminEmail}: ${params.code} (expires soon)`,
  });
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export async function verifyLoginChallengeAndConsume(
  challengeId: string,
  code: string,
  expectedAdminId: string
): Promise<boolean> {
  const supabase = createAdminServiceClient();
  const { data, error } = await supabase
    .from("admin_login_challenges")
    .select("id, admin_id, code_hash, expires_at, consumed_at")
    .eq("id", challengeId)
    .maybeSingle();
  if (error || !data) return false;
  if (data.consumed_at) return false;
  if (data.admin_id !== expectedAdminId) return false;
  if (new Date(data.expires_at as string) < new Date()) return false;
  if (!verifyLoginCode(code, data.code_hash as string)) return false;
  await supabase
    .from("admin_login_challenges")
    .update({ consumed_at: new Date().toISOString() })
    .eq("id", challengeId);
  return true;
}

export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, BCRYPT_ROUNDS);
}

/** Create a new admin (service role only). Prefer running from a trusted script or dashboard. */
export async function createAdminAccount(params: {
  email: string;
  plainPassword: string;
  name?: string;
}): Promise<{ id: string }> {
  const supabase = createAdminServiceClient();
  const email = params.email.trim().toLowerCase();
  const password_hash = await hashPassword(params.plainPassword);
  const { data, error } = await supabase
    .from("admins")
    .insert({
      email,
      password_hash,
      name: params.name ?? null,
      status: "active",
      failed_login_attempts: 0,
    })
    .select("id")
    .single();
  if (error || !data?.id) {
    throw new Error(error?.message ?? "Could not create admin");
  }
  return { id: data.id as string };
}
