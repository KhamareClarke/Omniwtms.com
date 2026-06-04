import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
import { cookies } from "next/headers";
import { createAdminServiceClient } from "@/lib/supabase/admin-service";
import { TENANT_ID_COOKIE, DEFAULT_TENANT_ID } from "@/lib/tenants/constants";
import { isValidTenantId } from "@/lib/tenants/context";

type Body = { email?: string; password?: string; kind?: "client" | "courier" | "customer" };

type PasswordGrantOk = {
  access_token: string;
  refresh_token: string;
  expires_in?: number;
  user?: { id: string };
};

async function passwordGrant(
  email: string,
  password: string
): Promise<
  | { ok: true; tokens: PasswordGrantOk }
  | { ok: false; reason: string; supabaseMessage?: string; httpStatus?: number }
> {
  const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
  if (!rawUrl || !anon) {
    return {
      ok: false,
      reason: "missing_env",
      supabaseMessage: "NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY must be set for password sign-in.",
    };
  }
  const url = rawUrl.replace(/\/$/, "");
  const res = await fetch(`${url}/auth/v1/token?grant_type=password`, {
    method: "POST",
    headers: {
      apikey: anon,
      Authorization: `Bearer ${anon}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email, password }),
  });
  const data = (await res.json().catch(() => null)) as Record<string, unknown> | null;
  if (!res.ok || !data || typeof data.access_token !== "string" || typeof data.refresh_token !== "string") {
    const msg =
      (data && typeof data.error_description === "string" && data.error_description) ||
      (data && typeof data.msg === "string" && data.msg) ||
      (data && typeof data.error === "string" && data.error) ||
      `HTTP ${res.status}`;
    return { ok: false, reason: "password_grant_failed", supabaseMessage: msg, httpStatus: res.status };
  }
  const user = data.user as { id?: string } | undefined;
  return {
    ok: true,
    tokens: {
      access_token: data.access_token,
      refresh_token: data.refresh_token,
      expires_in: typeof data.expires_in === "number" ? data.expires_in : undefined,
      user: user?.id ? { id: user.id } : undefined,
    },
  };
}

function decodeJwtSub(accessToken: string): string | null {
  try {
    const parts = accessToken.split(".");
    if (parts.length < 2) return null;
    const payload = JSON.parse(Buffer.from(parts[1], "base64url").toString("utf8")) as { sub?: string };
    return typeof payload.sub === "string" ? payload.sub : null;
  } catch {
    return null;
  }
}

async function findAuthUserIdByEmail(
  admin: ReturnType<typeof createAdminServiceClient>,
  email: string
): Promise<string | null> {
  const normalized = email.toLowerCase().trim();
  for (let page = 1; page <= 25; page++) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 200 });
    if (error) return null;
    const users = data?.users ?? [];
    const hit = users.find((u) => (u.email ?? "").toLowerCase() === normalized);
    if (hit?.id) return hit.id;
    if (users.length < 200) break;
  }
  return null;
}

async function setTenantCookie(tenantId: string) {
  const cookieStore = await cookies();
  cookieStore.set(TENANT_ID_COOKIE, tenantId, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 14,
  });
}

/**
 * After validating organization credentials against `clients`, ensures a Supabase Auth user
 * exists with matching password and `app_metadata.tenant_id`, upserts `tenant_memberships`,
 * and returns tokens for `supabase.auth.setSession` in the browser (enables RLS).
 */
export async function POST(request: NextRequest) {
  try {
    let body: Body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }

    const email = typeof body.email === "string" ? body.email.trim() : "";
    const password = typeof body.password === "string" ? body.password : "";
    const kind = body.kind ?? "client";

    if (!email || !password) {
      return NextResponse.json({ error: "email and password are required" }, { status: 400 });
    }

    if (kind !== "client" && kind !== "courier" && kind !== "customer") {
      return NextResponse.json(
        { error: "kind must be \"client\", \"courier\", or \"customer\"" },
        { status: 400 }
      );
    }

    let admin: ReturnType<typeof createAdminServiceClient>;
    try {
      admin = createAdminServiceClient();
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Configuration error";
      return NextResponse.json(
        {
          error: "Supabase admin is not configured",
          detail: msg,
          hint: "Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local, then restart the dev server.",
        },
        { status: 500 }
      );
    }

    const table = kind === "client" ? "clients" : kind === "courier" ? "couriers" : "customers";

    const { data: actor, error: actorErr } =
      kind === "customer"
        ? await admin
            .from(table)
            .select("id, tenant_id, email, password")
            .ilike("email", email)
            .maybeSingle()
        : await admin
            .from(table)
            .select("id, tenant_id, status, email")
            .ilike("email", email)
            .eq("password", password)
            .maybeSingle();

    if (actorErr || !actor) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    const row = actor as {
      id?: string;
      tenant_id?: string | null;
      status?: string;
      email?: string;
      password?: string;
    };
    if (kind === "customer" && row.password !== password) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    if (kind !== "customer" && row.status !== "active") {
      return NextResponse.json({ error: "Account is not active" }, { status: 403 });
    }

    const tenantIdRaw = row.tenant_id ?? DEFAULT_TENANT_ID;
    const tenantId = isValidTenantId(tenantIdRaw) ? tenantIdRaw : DEFAULT_TENANT_ID;

    const authEmail = (row.email as string)?.trim() || email;

    const appMeta =
      kind === "customer" && row.id
        ? { tenant_id: tenantId, customer_id: String(row.id) }
        : { tenant_id: tenantId };

    let tokens: PasswordGrantOk | null = null;
    let lastGrant = await passwordGrant(authEmail, password);
    if (lastGrant.ok) tokens = lastGrant.tokens;

    if (!tokens) {
      const { data: created, error: createErr } = await admin.auth.admin.createUser({
        email: authEmail,
        password,
        email_confirm: true,
        app_metadata: appMeta,
      });

      if (createErr) {
        const msg = createErr.message?.toLowerCase() ?? "";
        const duplicate = msg.includes("already") || msg.includes("registered") || createErr.status === 422;
        if (duplicate) {
          const uid = await findAuthUserIdByEmail(admin, authEmail);
          if (!uid) {
            return NextResponse.json(
              { error: "Auth user exists but could not be linked. Contact support." },
              { status: 500 }
            );
          }
          const { error: updErr } = await admin.auth.admin.updateUserById(uid, {
            password,
            app_metadata: appMeta,
          });
          if (updErr) {
            console.error("updateUserById", updErr);
            return NextResponse.json({ error: "Could not sync auth account" }, { status: 500 });
          }
          lastGrant = await passwordGrant(authEmail, password);
          if (lastGrant.ok) tokens = lastGrant.tokens;
        } else {
          console.error("createUser", createErr);
          return NextResponse.json({ error: "Could not create auth session" }, { status: 500 });
        }
      } else if (created?.user?.id) {
        lastGrant = await passwordGrant(authEmail, password);
        if (lastGrant.ok) tokens = lastGrant.tokens;
      }
    }

    if (!tokens) {
      const detail = !lastGrant.ok ? lastGrant.supabaseMessage : undefined;
      const hint =
        !lastGrant.ok && lastGrant.reason === "missing_env"
          ? "Add NEXT_PUBLIC_SUPABASE_ANON_KEY (and URL) to .env.local."
          : typeof detail === "string" &&
              (detail.toLowerCase().includes("email") && detail.toLowerCase().includes("disabled"))
            ? "In Supabase: Authentication → Providers → Email → enable sign-in with email/password."
            : undefined;
      return NextResponse.json(
        { error: "Could not obtain session", detail, hint },
        { status: 500 }
      );
    }

    const userId = tokens.user?.id ?? decodeJwtSub(tokens.access_token);
    if (!userId) {
      return NextResponse.json({ error: "Invalid token payload" }, { status: 500 });
    }

    const { error: metaErr } = await admin.auth.admin.updateUserById(userId, {
      app_metadata: appMeta,
    });
    if (metaErr) {
      console.error("updateUser metadata", metaErr);
    }

    const { error: memErr } = await admin.from("tenant_memberships").upsert(
      { user_id: userId, tenant_id: tenantId },
      { onConflict: "user_id" }
    );
    if (memErr) {
      console.error("tenant_memberships upsert", memErr);
      return NextResponse.json({ error: "Could not attach tenant membership" }, { status: 500 });
    }

    await setTenantCookie(tenantId);

    return NextResponse.json({
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      expires_in: tokens.expires_in ?? 3600,
    });
  } catch (e) {
    console.error("supabase-session-from-org", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
