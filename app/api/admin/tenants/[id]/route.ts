import { NextRequest, NextResponse } from "next/server";
import { createAdminServiceClient } from "@/lib/supabase/admin-service";
import { getVerifiedAdminFromRequest } from "@/lib/auth/require-admin-api";
import { writePlatformAudit } from "@/lib/admin/write-audit";
import { clientToTenantDetailForm, type ClientRecord } from "@/lib/admin/map-client-row";

type Ctx = { params: Promise<{ id: string }> };

const DEFAULT_TENANT_ID = "a0000001-0000-4000-8000-000000000001";

export async function GET(request: NextRequest, context: Ctx) {
  const admin = await getVerifiedAdminFromRequest();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await context.params;
  const supabase = createAdminServiceClient();

  const { data: clientRow, error: clientErr } = await supabase
    .from("clients")
    .select("id, email, company, status, created_at")
    .eq("id", id)
    .maybeSingle();

  if (!clientErr && clientRow) {
    return NextResponse.json({
      tenant: clientToTenantDetailForm(clientRow as ClientRecord),
      recentAudit: [] as unknown[],
      source: "client",
    });
  }

  const { data, error } = await supabase.from("tenants").select("*").eq("id", id).maybeSingle();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const auditQuery = await supabase
    .from("platform_admin_audit_log")
    .select("id, action, admin_name, admin_email, details, created_at, ip_address")
    .eq("tenant_id", id)
    .order("created_at", { ascending: false })
    .limit(50);

  const recentAudit =
    auditQuery.error && (auditQuery.error.code === "42P01" || auditQuery.error.message?.includes("does not exist"))
      ? []
      : auditQuery.data ?? [];

  return NextResponse.json({ tenant: data, recentAudit, source: "tenant" });
}

function normalizeClientStatus(status: unknown): "active" | "inactive" {
  const s = String(status || "active").toLowerCase();
  if (s === "suspended" || s === "inactive" || s === "expired") return "inactive";
  return "active";
}

export async function PATCH(request: NextRequest, context: Ctx) {
  const admin = await getVerifiedAdminFromRequest();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await context.params;

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const supabase = createAdminServiceClient();

  const { data: existingClient } = await supabase
    .from("clients")
    .select("id, email, company, status")
    .eq("id", id)
    .maybeSingle();

  if (existingClient) {
    const patchClient: Record<string, unknown> = {};
    if (typeof body.name === "string") patchClient.company = body.name;
    if (typeof body.admin_email === "string") patchClient.email = body.admin_email.trim().toLowerCase();
    if (body.status != null) patchClient.status = normalizeClientStatus(body.status);

    const { data: updated, error } = await supabase
      .from("clients")
      .update(patchClient)
      .eq("id", id)
      .select("id, email, company, status, created_at")
      .single();

    if (error) {
      console.error("patch client:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    await writePlatformAudit(supabase, admin, request, {
      action: "client.update",
      tenantId: null,
      tenantName: updated.company,
      resourceType: "client",
      details: { id, patch: patchClient },
    });

    return NextResponse.json({
      tenant: clientToTenantDetailForm(updated as ClientRecord),
      source: "client",
    });
  }

  const allowed = [
    "name",
    "admin_email",
    "admin_name",
    "domain",
    "license_plan",
    "license_expires_at",
    "status",
    "stripe_customer_id",
    "stripe_subscription_id",
    "stripe_price_id",
    "billing_cycle_day",
    "monthly_cost",
    "next_billing_date",
    "primary_color",
    "secondary_color",
    "text_color",
    "logo_url",
    "feature_live_tracking",
    "feature_3d_warehouse",
    "feature_ecommerce",
    "feature_api_access",
    "feature_white_label",
    "feature_advanced_reporting",
    "feature_empire_os",
    "max_warehouses",
    "max_couriers",
    "max_customers",
    "max_orders_per_month",
    "max_api_calls_per_month",
    "max_storage_gb",
    "max_team_members",
    "ghl_location_id",
    "ghl_api_key",
  ] as const;

  const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
  for (const key of allowed) {
    if (key in body) {
      patch[key] = body[key];
    }
  }

  const { data: before } = await supabase.from("tenants").select("name").eq("id", id).maybeSingle();

  const { data, error } = await supabase.from("tenants").update(patch).eq("id", id).select("*").single();
  if (error) {
    console.error("patch tenant:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  await writePlatformAudit(supabase, admin, request, {
    action: "tenant.update",
    tenantId: id,
    tenantName: data.name,
    details: { before, patch },
  });

  return NextResponse.json({ tenant: data, source: "tenant" });
}

export async function DELETE(request: NextRequest, context: Ctx) {
  const admin = await getVerifiedAdminFromRequest();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await context.params;

  if (id === DEFAULT_TENANT_ID) {
    return NextResponse.json({ error: "Cannot delete the platform default tenant" }, { status: 400 });
  }

  const supabase = createAdminServiceClient();

  const { data: clientRow } = await supabase.from("clients").select("id, company").eq("id", id).maybeSingle();
  if (clientRow) {
    return NextResponse.json(
      {
        error:
          "Client organizations cannot be deleted from here. Suspend the account or remove the row in Supabase.",
      },
      { status: 400 }
    );
  }

  const { data: row } = await supabase.from("tenants").select("id, name").eq("id", id).maybeSingle();
  if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { error } = await supabase
    .from("tenants")
    .update({
      deleted_at: new Date().toISOString(),
      status: "suspended",
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) {
    console.error("soft delete tenant:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  await writePlatformAudit(supabase, admin, request, {
    action: "tenant.soft_delete",
    tenantId: id,
    tenantName: row.name,
    details: {},
  });

  return NextResponse.json({ ok: true });
}
