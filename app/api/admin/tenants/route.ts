import { NextRequest, NextResponse } from "next/server";
import { createAdminServiceClient } from "@/lib/supabase/admin-service";
import { getVerifiedAdminFromRequest } from "@/lib/auth/require-admin-api";
import { writePlatformAudit } from "@/lib/admin/write-audit";
import { clientToAdminOrgRow, type ClientRecord } from "@/lib/admin/map-client-row";
import { createCustomer, createSubscription, hasStripeSecretKey } from "@/lib/stripe/client";

function slugDomain(name: string): string {
  const base = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 40);
  return base || "org";
}

/**
 * GET /api/admin/tenants?status=&plan=&search=
 * Lists registered **client organizations** (same data as legacy /dashboard admin tab).
 * POST still creates a **tenant** (license) row for new SaaS-style orgs.
 */
export async function GET(request: NextRequest) {
  const admin = await getVerifiedAdminFromRequest();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const sp = request.nextUrl.searchParams;
  const statusFilter = sp.get("status") || "all";
  const planFilter = sp.get("plan") || "all";
  const search = (sp.get("search") || "").trim().toLowerCase();

  const supabase = createAdminServiceClient();
  const { data: clients, error } = await supabase
    .from("clients")
    .select("id, email, company, status, created_at")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("admin tenants (clients):", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  let list = (clients || []).map((c) => clientToAdminOrgRow(c as ClientRecord));

  if (statusFilter !== "all") {
    if (statusFilter === "suspended") {
      list = list.filter((r) => r.status === "suspended");
    } else if (statusFilter === "expired" || statusFilter === "trial") {
      list = [];
    } else {
      list = list.filter((r) => r.status === statusFilter);
    }
  }

  if (planFilter !== "all") {
    list = list.filter((r) => r.license_plan === planFilter);
  }

  if (search) {
    list = list.filter(
      (t) =>
        t.name?.toLowerCase().includes(search) ||
        t.admin_email?.toLowerCase().includes(search)
    );
  }

  return NextResponse.json({ tenants: list });
}

export async function POST(request: NextRequest) {
  const admin = await getVerifiedAdminFromRequest();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const name = typeof body.name === "string" ? body.name.trim() : "";
  const adminEmail = typeof body.admin_email === "string" ? body.admin_email.trim().toLowerCase() : "";
  const adminName = typeof body.admin_name === "string" ? body.admin_name.trim() : null;
  const plan = typeof body.license_plan === "string" ? body.license_plan.trim() : "starter";
  const licenseExpiresAt =
    typeof body.license_expires_at === "string" && body.license_expires_at
      ? body.license_expires_at
      : null;

  if (!name || !adminEmail) {
    return NextResponse.json({ error: "name and admin_email are required" }, { status: 400 });
  }

  const supabase = createAdminServiceClient();
  const domain = `${slugDomain(name)}-${Date.now().toString(36)}`;
  const insertPayload: Record<string, unknown> = {
    name,
    admin_email: adminEmail,
    admin_name: adminName,
    domain,
    license_plan: plan,
    license_expires_at: licenseExpiresAt,
    status: "trial",
    monthly_cost: body.monthly_cost != null ? Number(body.monthly_cost) : null,
  };

  const { data: created, error } = await supabase.from("tenants").insert(insertPayload).select("id, name").single();

  if (error) {
    console.error("create tenant:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  await writePlatformAudit(supabase, admin, request, {
    action: "tenant.create",
    tenantId: created.id,
    tenantName: created.name,
    details: { name, admin_email: adminEmail, license_plan: plan },
  });

  let stripeError: string | undefined;
  if (hasStripeSecretKey()) {
    const defaultPrice = process.env.STRIPE_DEFAULT_PRICE_ID?.trim();
    try {
      const customer = await createCustomer(created.id, name, adminEmail);
      if (defaultPrice) {
        await createSubscription(customer.id, defaultPrice, created.id);
      }
    } catch (e) {
      stripeError = e instanceof Error ? e.message : String(e);
      console.error("tenant.create stripe:", e);
    }
  }

  return NextResponse.json({ tenant: created, stripe_error: stripeError });
}
