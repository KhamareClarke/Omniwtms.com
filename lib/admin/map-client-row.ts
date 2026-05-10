/** Map DB `clients` row to the shape used by /admin/tenants list + detail. */

export type ClientRecord = {
  id: string;
  email: string;
  company: string;
  status: string;
  created_at: string;
};

export function clientToAdminOrgRow(c: ClientRecord) {
  const st = (c.status || "active").toLowerCase();
  const normalizedStatus = st === "inactive" || st === "suspended" ? "suspended" : st === "active" ? "active" : st;
  return {
    id: c.id,
    name: c.company,
    admin_email: c.email,
    license_plan: "standard",
    status: normalizedStatus,
    monthly_cost: null as number | null,
    created_at: c.created_at,
    record_type: "client" as const,
  };
}

export function clientToTenantDetailForm(c: ClientRecord) {
  const base = clientToAdminOrgRow(c);
  return {
    ...base,
    name: c.company,
    admin_name: null,
    domain: null,
    license_expires_at: null,
    last_activity_at: null,
    stripe_customer_id: null,
    next_billing_date: null,
    primary_color: null,
    secondary_color: null,
    text_color: null,
    logo_url: null,
    feature_live_tracking: false,
    feature_3d_warehouse: false,
    feature_ecommerce: false,
    feature_api_access: false,
    feature_white_label: false,
    feature_advanced_reporting: false,
    feature_empire_os: false,
    max_warehouses: null,
    max_couriers: null,
    max_customers: null,
    max_orders_per_month: null,
    max_api_calls_per_month: null,
    max_storage_gb: null,
    max_team_members: null,
    ghl_location_id: null,
    ghl_api_key: null,
    deleted_at: null,
    updated_at: null,
  };
}
