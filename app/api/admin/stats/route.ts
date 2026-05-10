import { NextResponse } from "next/server";
import { createAdminServiceClient } from "@/lib/supabase/admin-service";
import { getVerifiedAdminFromRequest } from "@/lib/auth/require-admin-api";
import { clientToAdminOrgRow, type ClientRecord } from "@/lib/admin/map-client-row";

/**
 * GET /api/admin/stats — KPIs from **clients** (real orgs) + license/MRR from **tenants**.
 */
export async function GET() {
  const admin = await getVerifiedAdminFromRequest();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createAdminServiceClient();

  const { data: clients, error: clientErr } = await supabase
    .from("clients")
    .select("id, email, company, status, created_at");

  if (clientErr) {
    console.error("admin stats clients:", clientErr);
    return NextResponse.json({ error: clientErr.message }, { status: 500 });
  }

  const clientRows = clients || [];
  const totalOrgs = clientRows.length;
  let activeOrgs = 0;
  let suspendedOrgs = 0;
  for (const c of clientRows) {
    const st = (c.status || "active").toString().toLowerCase();
    if (st === "inactive" || st === "suspended") suspendedOrgs++;
    else if (st === "active") activeOrgs++;
  }

  const { data: tenantRows, error: tenantErr } = await supabase
    .from("tenants")
    .select("id, name, status, license_plan, license_expires_at, monthly_cost, created_at, deleted_at");

  if (tenantErr) {
    console.error("admin stats tenants:", tenantErr);
  }

  const tenants = (tenantRows || []).filter((t) => !t.deleted_at);
  const trialOrgs = tenants.filter((t) => t.status === "trial").length;
  const expiredStatusOrgs = tenants.filter((t) => t.status === "expired").length;

  let mrr = 0;
  const now = new Date();
  const in30 = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

  const licenseAlerts: {
    id: string;
    name: string;
    license_expires_at: string;
    daysLeft: number;
    kind: "expiring" | "expired";
  }[] = [];

  const alertById = new Map<string, (typeof licenseAlerts)[0]>();

  for (const t of tenants) {
    const cost = Number(t.monthly_cost);
    if (!Number.isNaN(cost) && t.status === "active") {
      mrr += cost;
    }

    if (t.license_expires_at && t.status !== "suspended") {
      const exp = new Date(t.license_expires_at);
      if (t.status === "active" && exp < now) {
        alertById.set(t.id, {
          id: t.id,
          name: t.name,
          license_expires_at: t.license_expires_at,
          daysLeft: 0,
          kind: "expired",
        });
      } else if (exp > now && exp <= in30) {
        const daysLeft = Math.ceil((exp.getTime() - now.getTime()) / (24 * 60 * 60 * 1000));
        if (!alertById.has(t.id)) {
          alertById.set(t.id, {
            id: t.id,
            name: t.name,
            license_expires_at: t.license_expires_at,
            daysLeft,
            kind: "expiring",
          });
        }
      }
    }
  }

  licenseAlerts.push(...alertById.values());

  const recentOrgs = [...clientRows]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 10)
    .map((c) => {
      const row = clientToAdminOrgRow(c as ClientRecord);
      return {
        id: row.id,
        name: row.name,
        status: row.status,
        license_plan: "—",
        created_at: row.created_at,
      };
    });

  return NextResponse.json({
    stats: {
      totalOrgs,
      activeOrgs,
      suspendedOrgs,
      trialOrgs,
      expiredOrgs: expiredStatusOrgs,
      totalMrr: Math.round(mrr * 100) / 100,
      totalArr: Math.round(mrr * 12 * 100) / 100,
      systemUptimeLabel: process.env.NEXT_PUBLIC_PLATFORM_UPTIME_LABEL || "Operational",
    },
    alerts: {
      licensesExpiringSoon: licenseAlerts,
      paymentsFailed: [] as { id: string; message: string }[],
    },
    recentOrganizations: recentOrgs,
  });
}
