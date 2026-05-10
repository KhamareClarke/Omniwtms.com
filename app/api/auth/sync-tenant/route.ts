import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createAdminServiceClient } from "@/lib/supabase/admin-service";
import { TENANT_ID_COOKIE, DEFAULT_TENANT_ID } from "@/lib/tenants/constants";

type Body = { clientId?: string; courierId?: string; customerId?: string };

/**
 * POST /api/auth/sync-tenant
 * Resolves tenant_id for a logged-in actor and sets httpOnly cookie for middleware + APIs.
 */
export async function POST(request: NextRequest) {
  try {
    let body: Body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }

    const keys = [body.clientId, body.courierId, body.customerId].filter(Boolean);
    if (keys.length !== 1) {
      return NextResponse.json(
        { error: "Provide exactly one of: clientId, courierId, customerId" },
        { status: 400 }
      );
    }

    const supabase = createAdminServiceClient();
    let tenantId: string | null = null;

    if (body.clientId) {
      const { data, error } = await supabase
        .from("clients")
        .select("tenant_id")
        .eq("id", body.clientId)
        .maybeSingle();
      if (error || !data) {
        return NextResponse.json({ error: "Client not found" }, { status: 404 });
      }
      tenantId = (data as { tenant_id?: string | null }).tenant_id ?? DEFAULT_TENANT_ID;
    } else if (body.courierId) {
      const { data, error } = await supabase
        .from("couriers")
        .select("tenant_id")
        .eq("id", body.courierId)
        .maybeSingle();
      if (error || !data) {
        return NextResponse.json({ error: "Courier not found" }, { status: 404 });
      }
      tenantId = (data as { tenant_id?: string | null }).tenant_id ?? DEFAULT_TENANT_ID;
    } else if (body.customerId) {
      const { data, error } = await supabase
        .from("customers")
        .select("tenant_id")
        .eq("id", body.customerId)
        .maybeSingle();
      if (error || !data) {
        return NextResponse.json({ error: "Customer not found" }, { status: 404 });
      }
      tenantId = (data as { tenant_id?: string | null }).tenant_id ?? DEFAULT_TENANT_ID;
    }

    if (!tenantId) {
      return NextResponse.json({ error: "Could not resolve tenant" }, { status: 500 });
    }

    const cookieStore = await cookies();
    cookieStore.set(TENANT_ID_COOKIE, tenantId, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 14,
    });

    return NextResponse.json({ ok: true, tenant_id: tenantId });
  } catch (e) {
    console.error("sync-tenant", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

/** Clears tenant cookie (call on org logout). */
export async function DELETE() {
  const cookieStore = await cookies();
  cookieStore.delete(TENANT_ID_COOKIE);
  return NextResponse.json({ ok: true });
}
