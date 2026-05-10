import { cookies } from "next/headers";
import { createAdminServiceClient } from "@/lib/supabase/admin-service";
import { ADMIN_SESSION_COOKIE, verifyAdminSessionToken } from "@/lib/auth/admin-session";

export type VerifiedAdmin = { id: string; email: string; name: string | null };

/** Validates admin httpOnly session; returns null if missing or invalid. */
export async function getVerifiedAdminFromRequest(): Promise<VerifiedAdmin | null> {
  const cookieStore = await cookies();
  const raw = cookieStore.get(ADMIN_SESSION_COOKIE)?.value;
  if (!raw) return null;
  const payload = await verifyAdminSessionToken(raw);
  if (!payload) return null;
  const supabase = createAdminServiceClient();
  const { data, error } = await supabase
    .from("admins")
    .select("id, email, name, status")
    .eq("id", payload.sub)
    .maybeSingle();
  if (error || !data || data.status === "inactive") return null;
  return { id: data.id, email: data.email, name: data.name };
}
