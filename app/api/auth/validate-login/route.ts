import { NextRequest, NextResponse } from "next/server";
import { createAdminServiceClient } from "@/lib/supabase/admin-service";
import { emitEmpireActivity } from "@/lib/empire-activity";

export const runtime = "nodejs";

type Kind = "client" | "courier" | "customer";

/**
 * Validates org / courier / customer credentials using the same Supabase project as
 * `POST /api/auth/supabase-session-from-org` (server env). Replaces client-side service-role
 * calls that used a different hardcoded project and caused “Could not start database session”.
 */
export async function POST(request: NextRequest) {
  try {
    let body: { kind?: unknown; email?: unknown; password?: unknown };
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }

    const kind = typeof body.kind === "string" ? (body.kind as Kind) : null;
    const email = typeof body.email === "string" ? body.email.trim() : "";
    const password = typeof body.password === "string" ? body.password : "";

    if (!email || !password) {
      return NextResponse.json({ error: "email and password are required" }, { status: 400 });
    }

    if (kind !== "client" && kind !== "courier" && kind !== "customer") {
      return NextResponse.json({ error: "kind must be client, courier, or customer" }, { status: 400 });
    }

    let admin;
    try {
      admin = createAdminServiceClient();
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Configuration error";
      return NextResponse.json(
        {
          error: "Supabase admin is not configured on the server",
          detail: msg,
          hint: "Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local, then restart `next dev`.",
        },
        { status: 500 }
      );
    }

    if (kind === "client") {
      const { data: courierOnly } = await admin.from("couriers").select("id").ilike("email", email).maybeSingle();
      const { data: orgUser } = await admin.from("clients").select("id").ilike("email", email).maybeSingle();
      if (courierOnly && !orgUser) {
        return NextResponse.json(
          { error: "This email is registered as a courier. Please use the Courier tab to sign in." },
          { status: 403 }
        );
      }

      const { data: client, error } = await admin
        .from("clients")
        .select("id, email, company, status, tenant_id")
        .ilike("email", email)
        .eq("password", password)
        .maybeSingle();

      if (error || !client) {
        void emitEmpireActivity({
          event_type: "signin_failed",
          user_email: email,
          message: "Invalid client credentials",
          metadata: { kind },
          request,
        });
        return NextResponse.json({ error: "Incorrect email or password. Please try again." }, { status: 401 });
      }

      if (client.status !== "active") {
        void emitEmpireActivity({
          event_type: "signin_failed",
          user_email: email,
          user_id: client.id,
          message: "Client account inactive",
          metadata: { kind, status: client.status },
          request,
        });
        return NextResponse.json({ error: "Account is not active. Please contact support." }, { status: 403 });
      }

      void emitEmpireActivity({
        event_type: "signin",
        user_email: client.email,
        user_id: client.id,
        user_name: client.company,
        metadata: { kind: "client", tenant_id: client.tenant_id },
        request,
      });

      return NextResponse.json({ ok: true, client });
    }

    if (kind === "courier") {
      const { data: orgUser } = await admin.from("clients").select("id").ilike("email", email).maybeSingle();
      if (orgUser) {
        return NextResponse.json(
          {
            error:
              "This email is registered as an organization. Please use the Organization tab to sign in.",
          },
          { status: 403 }
        );
      }

      const { data: courier, error } = await admin
        .from("couriers")
        .select("*")
        .ilike("email", email)
        .eq("password", password)
        .maybeSingle();

      if (error || !courier) {
        void emitEmpireActivity({
          event_type: "signin_failed",
          user_email: email,
          message: "Invalid courier credentials",
          metadata: { kind },
          request,
        });
        return NextResponse.json({ error: "Incorrect email or password. Please try again." }, { status: 401 });
      }

      if (courier.status !== "active") {
        void emitEmpireActivity({
          event_type: "signin_failed",
          user_email: email,
          user_id: courier.id,
          message: "Courier account inactive",
          metadata: { kind, status: courier.status },
          request,
        });
        return NextResponse.json({ error: "Account is not active. Please contact support." }, { status: 403 });
      }

      void emitEmpireActivity({
        event_type: "signin",
        user_email: courier.email,
        user_id: courier.id,
        metadata: { kind: "courier" },
        request,
      });

      return NextResponse.json({ ok: true, courier });
    }

    const { data: customer, error } = await admin
      .from("customers")
      .select("*")
      .ilike("email", email)
      .maybeSingle();

    if (error || !customer) {
      void emitEmpireActivity({
        event_type: "signin_failed",
        user_email: email,
        message: "Invalid customer credentials",
        metadata: { kind },
        request,
      });
      return NextResponse.json({ error: "Incorrect email or password. Please try again." }, { status: 401 });
    }

    if (customer.password !== password) {
      void emitEmpireActivity({
        event_type: "signin_failed",
        user_email: email,
        user_id: customer.id,
        message: "Wrong password",
        metadata: { kind },
        request,
      });
      return NextResponse.json({ error: "Incorrect password. Please try again." }, { status: 401 });
    }

    void emitEmpireActivity({
      event_type: "signin",
      user_email: customer.email,
      user_id: customer.id,
      metadata: { kind: "customer" },
      request,
    });

    return NextResponse.json({ ok: true, customer });
  } catch (e) {
    console.error("validate-login", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
