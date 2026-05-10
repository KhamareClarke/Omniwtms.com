import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/** Accepts full URL or bare project ref (e.g. `abcdefgh` → `https://abcdefgh.supabase.co`). */
function normalizeSupabaseUrl(raw: string): string {
  const t = raw.trim().replace(/^["']|["']$/g, "");
  if (/^https?:\/\//i.test(t)) return t;
  if (/^[a-z0-9-]{8,64}$/i.test(t) && !t.includes(".")) {
    return `https://${t}.supabase.co`;
  }
  return t;
}

function assertSupabaseHttpUrl(raw: string): string {
  const url = normalizeSupabaseUrl(raw);
  try {
    const u = new URL(url);
    if (u.protocol !== "http:" && u.protocol !== "https:") {
      throw new Error("not http(s)");
    }
  } catch {
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_URL must be your real project URL, e.g. https://abcdefgh.supabase.co (not the placeholder text). Set it in .env.local and restart next dev."
    );
  }
  return url;
}

/**
 * Service-role client for server-only admin flows (bypasses RLS).
 * Never import this from client components.
 */
export function createAdminServiceClient(): SupabaseClient {
  const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!rawUrl?.trim() || !key) {
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required for admin auth (see .env.example)"
    );
  }
  const url = assertSupabaseHttpUrl(rawUrl);
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
