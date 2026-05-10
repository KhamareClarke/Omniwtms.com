"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Save, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

type TenantRow = Record<string, unknown>;

const PLANS = ["starter", "professional", "enterprise", "standard"];

export default function AdminTenantDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [source, setSource] = useState<"tenant" | "client">("tenant");
  const [form, setForm] = useState<TenantRow>({});
  const [audit, setAudit] = useState<
    Array<{
      id: string;
      action: string;
      admin_name: string | null;
      admin_email: string | null;
      details: unknown;
      created_at: string;
      ip_address: string | null;
    }>
  >([]);
  const [billingSnap, setBillingSnap] = useState<{
    usage: { apiCalls: number; storageGb: number; orders: number; deliveries: number };
    overage: {
      totalGbp: number;
      apiChargeGbp: number;
      storageChargeGbp: number;
      ordersChargeGbp: number;
      deliveriesChargeGbp: number;
    };
    invoices: Array<{
      id: string;
      period_start: string;
      period_end: string;
      total_amount_gbp: number;
      status: string;
      created_at: string;
    }>;
  } | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/tenants/${id}`, { credentials: "include" });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Failed to load");
        router.push("/admin/tenants");
        return;
      }
      setForm(data.tenant || {});
      setAudit(data.recentAudit || []);
      setSource(data.source === "client" ? "client" : "tenant");
    } catch {
      toast.error("Failed to load");
      router.push("/admin/tenants");
    } finally {
      setLoading(false);
    }
  }, [id, router]);

  useEffect(() => {
    load();
  }, [load]);

  const loadBilling = useCallback(async () => {
    if (!id) return;
    try {
      const res = await fetch(`/api/admin/tenants/${id}/billing`, { credentials: "include" });
      const data = await res.json();
      if (!res.ok) {
        setBillingSnap(null);
        return;
      }
      setBillingSnap({
        usage: data.usage,
        overage: data.overage,
        invoices: data.invoices || [],
      });
    } catch {
      setBillingSnap(null);
    }
  }, [id]);

  useEffect(() => {
    if (!loading) void loadBilling();
  }, [loading, id, loadBilling]);

  const set = (key: string, value: unknown) => setForm((f) => ({ ...f, [key]: value }));

  const save = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/tenants/${id}`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          admin_email: form.admin_email,
          admin_name: form.admin_name,
          domain: form.domain,
          license_plan: form.license_plan,
          license_expires_at: form.license_expires_at || null,
          status: form.status,
          stripe_customer_id: form.stripe_customer_id,
          stripe_subscription_id: form.stripe_subscription_id,
          stripe_price_id: form.stripe_price_id,
          billing_cycle_day: numOrNull(form.billing_cycle_day) ?? 1,
          monthly_cost: form.monthly_cost === "" || form.monthly_cost == null ? null : Number(form.monthly_cost),
          next_billing_date: form.next_billing_date || null,
          primary_color: form.primary_color,
          secondary_color: form.secondary_color,
          text_color: form.text_color,
          logo_url: form.logo_url,
          feature_live_tracking: !!form.feature_live_tracking,
          feature_3d_warehouse: !!form.feature_3d_warehouse,
          feature_ecommerce: !!form.feature_ecommerce,
          feature_api_access: !!form.feature_api_access,
          feature_white_label: !!form.feature_white_label,
          feature_advanced_reporting: !!form.feature_advanced_reporting,
          feature_empire_os: !!form.feature_empire_os,
          max_warehouses: numOrNull(form.max_warehouses),
          max_couriers: numOrNull(form.max_couriers),
          max_customers: numOrNull(form.max_customers),
          max_orders_per_month: numOrNull(form.max_orders_per_month),
          max_api_calls_per_month: numOrNull(form.max_api_calls_per_month),
          max_storage_gb: numOrNull(form.max_storage_gb),
          max_team_members: numOrNull(form.max_team_members),
          ghl_location_id: form.ghl_location_id,
          ghl_api_key: form.ghl_api_key,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Save failed");
      toast.success("Saved");
      setForm(data.tenant || {});
      load();
      loadBilling();
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const numOrNull = (v: unknown) => {
    if (v === "" || v == null) return null;
    const n = Number(v);
    return Number.isNaN(n) ? null : n;
  };

  const setStatusRemote = async (status: string) => {
    try {
      const res = await fetch(`/api/admin/tenants/${id}`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Update failed");
      toast.success(status === "suspended" ? "Suspended" : "Reactivated");
      setForm(data.tenant || {});
      load();
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Update failed");
    }
  };

  const remove = async () => {
    try {
      const res = await fetch(`/api/admin/tenants/${id}`, { method: "DELETE", credentials: "include" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Delete failed");
      toast.success("Organization deleted");
      router.push("/admin/tenants");
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Delete failed");
    }
  };

  if (loading) {
    return <div className="text-center py-20 text-slate-600">Loading…</div>;
  }

  const isDefault = id === "a0000001-0000-4000-8000-000000000001";
  const isClient = source === "client";

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-16">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/admin/tenants" aria-label="Back">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">{String(form.name || "Organization")}</h1>
            <p className="text-sm text-slate-600">
              {isClient ? "Client organization" : "License tenant"} · ID: {id}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            onClick={() => setStatusRemote("suspended")}
            disabled={form.status === "suspended"}
          >
            Suspend
          </Button>
          <Button
            variant="outline"
            onClick={() => setStatusRemote("active")}
            disabled={form.status === "active"}
          >
            Reactivate
          </Button>
          <Button onClick={save} disabled={saving} className="gap-2">
            <Save className="h-4 w-4" />
            {saving ? "Saving…" : "Save changes"}
          </Button>
          {!isDefault && !isClient && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" className="gap-2">
                  <Trash2 className="h-4 w-4" />
                  Delete
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete this organization?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Soft-deletes the tenant. This may not remove historical data references.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction className="bg-red-600" onClick={remove}>
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Organization</CardTitle>
          <CardDescription>Core profile and access</CardDescription>
        </CardHeader>
        <CardContent className="grid sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Name</Label>
            <Input value={String(form.name ?? "")} onChange={(e) => set("name", e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Admin email</Label>
            <Input
              type="email"
              value={String(form.admin_email ?? "")}
              onChange={(e) => set("admin_email", e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>Admin name</Label>
            <Input value={String(form.admin_name ?? "")} onChange={(e) => set("admin_name", e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Domain</Label>
            <Input value={String(form.domain ?? "")} onChange={(e) => set("domain", e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Status</Label>
            <Select value={String(form.status ?? "active")} onValueChange={(v) => set("status", v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Active</SelectItem>
                {!isClient && <SelectItem value="trial">Trial</SelectItem>}
                <SelectItem value="suspended">Suspended</SelectItem>
                {!isClient && <SelectItem value="expired">Expired</SelectItem>}
              </SelectContent>
            </Select>
          </div>
          {!isClient && (
            <>
              <div className="space-y-2">
                <Label>Plan</Label>
                <Select
                  value={String(form.license_plan ?? "standard")}
                  onValueChange={(v) => set("license_plan", v)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PLANS.map((p) => (
                      <SelectItem key={p} value={p} className="capitalize">
                        {p}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>License expires</Label>
                <Input
                  type="datetime-local"
                  value={isoToLocal(String(form.license_expires_at ?? ""))}
                  onChange={(e) => set("license_expires_at", localToIso(e.target.value))}
                />
              </div>
            </>
          )}
          <div className="space-y-2">
            <Label>Last activity</Label>
            <Input
              readOnly
              className="bg-slate-50"
              value={
                form.last_activity_at
                  ? new Date(String(form.last_activity_at)).toLocaleString()
                  : "—"
              }
            />
          </div>
        </CardContent>
      </Card>

      {isClient && (
        <Card className="border-blue-200 bg-blue-50/50">
          <CardHeader>
            <CardTitle className="text-base">Registered client</CardTitle>
            <CardDescription>
              This organization is a registered client account (dashboard login), not a separate license-only
              tenant. Feature flags and billing apply to SaaS tenant records only.
            </CardDescription>
          </CardHeader>
        </Card>
      )}

      <Card id="team">
        <CardHeader>
          <CardTitle>Team & users</CardTitle>
          <CardDescription>
            End-user accounts are managed in Supabase Auth and <code>tenant_memberships</code>. This section is
            reserved for a future user-management UI.
          </CardDescription>
        </CardHeader>
      </Card>

      {!isClient && (
      <Card>
        <CardHeader>
          <CardTitle>Feature flags</CardTitle>
        </CardHeader>
        <CardContent className="grid sm:grid-cols-2 gap-3">
          {[
            ["feature_live_tracking", "Live tracking"],
            ["feature_3d_warehouse", "3D warehouse"],
            ["feature_ecommerce", "E-commerce"],
            ["feature_api_access", "API access"],
            ["feature_white_label", "White label"],
            ["feature_advanced_reporting", "Advanced reporting"],
            ["feature_empire_os", "Empire OS"],
          ].map(([key, label]) => (
            <label key={key} className="flex items-center gap-2 text-sm">
              <Checkbox
                checked={!!form[key]}
                onCheckedChange={(c) => set(key, c === true)}
              />
              {label}
            </label>
          ))}
        </CardContent>
      </Card>
      )}

      {!isClient && (
      <Card>
        <CardHeader>
          <CardTitle>Usage limits</CardTitle>
        </CardHeader>
        <CardContent className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
          {[
            ["max_warehouses", "Max warehouses"],
            ["max_couriers", "Max couriers"],
            ["max_customers", "Max customers"],
            ["max_orders_per_month", "Max orders / month"],
            ["max_api_calls_per_month", "Max API calls / month"],
            ["max_storage_gb", "Max storage (GB)"],
            ["max_team_members", "Max team members"],
          ].map(([key, label]) => (
            <div key={key} className="space-y-2">
              <Label>{label}</Label>
              <Input
                type="number"
                value={form[key] == null ? "" : String(form[key])}
                onChange={(e) => set(key, e.target.value)}
              />
            </div>
          ))}
        </CardContent>
      </Card>
      )}

      {!isClient && (
      <Card>
        <CardHeader>
          <CardTitle>Billing & Stripe</CardTitle>
          <CardDescription>
            Plan cost, Stripe identifiers, and usage this month (UTC). Cron:{" "}
            <code className="text-xs">POST /api/cron/billing-monthly</code> on each tenant&apos;s billing day.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Current plan</Label>
              <Input readOnly className="bg-slate-50 capitalize" value={String(form.license_plan ?? "")} />
            </div>
            <div className="space-y-2">
              <Label>Monthly cost (£)</Label>
              <Input
                type="number"
                step="0.01"
                value={form.monthly_cost == null ? "" : String(form.monthly_cost)}
                onChange={(e) => set("monthly_cost", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Next billing date</Label>
              <Input
                type="date"
                value={String(form.next_billing_date ?? "").slice(0, 10)}
                onChange={(e) => set("next_billing_date", e.target.value || null)}
              />
            </div>
            <div className="space-y-2">
              <Label>Billing cycle day (1–28, UTC)</Label>
              <Input
                type="number"
                min={1}
                max={28}
                value={form.billing_cycle_day == null ? "" : String(form.billing_cycle_day)}
                onChange={(e) => set("billing_cycle_day", e.target.value)}
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label>Stripe customer ID</Label>
              <Input
                value={String(form.stripe_customer_id ?? "")}
                onChange={(e) => set("stripe_customer_id", e.target.value)}
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label>Stripe subscription ID</Label>
              <Input
                value={String(form.stripe_subscription_id ?? "")}
                onChange={(e) => set("stripe_subscription_id", e.target.value)}
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label>Stripe price ID (monthly)</Label>
              <Input
                value={String(form.stripe_price_id ?? "")}
                onChange={(e) => set("stripe_price_id", e.target.value)}
              />
            </div>
          </div>

          {billingSnap && (
            <div className="rounded-lg border border-slate-200 bg-slate-50/80 p-4 space-y-3">
              <p className="text-sm font-medium text-slate-800">Usage this month</p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-sm">
                <div>
                  <span className="text-slate-500">API calls</span>
                  <div className="font-mono">{billingSnap.usage.apiCalls}</div>
                </div>
                <div>
                  <span className="text-slate-500">Storage (GB est.)</span>
                  <div className="font-mono">{billingSnap.usage.storageGb}</div>
                </div>
                <div>
                  <span className="text-slate-500">Orders</span>
                  <div className="font-mono">{billingSnap.usage.orders}</div>
                </div>
                <div>
                  <span className="text-slate-500">Deliveries</span>
                  <div className="font-mono">{billingSnap.usage.deliveries}</div>
                </div>
              </div>
              <p className="text-sm text-slate-700">
                Overage (calculated): <strong>£{billingSnap.overage.totalGbp.toFixed(2)}</strong>
                <span className="text-slate-500 text-xs ml-2">
                  (API £{billingSnap.overage.apiChargeGbp.toFixed(2)} · storage £
                  {billingSnap.overage.storageChargeGbp.toFixed(2)} · orders £
                  {billingSnap.overage.ordersChargeGbp.toFixed(2)} · deliveries £
                  {billingSnap.overage.deliveriesChargeGbp.toFixed(2)})
                </span>
              </p>
            </div>
          )}

          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="secondary"
              onClick={async () => {
                const priceId = typeof window !== "undefined" ? window.prompt("New Stripe price_… id") : null;
                if (!priceId?.trim()) return;
                const res = await fetch(`/api/admin/tenants/${id}/billing/plan`, {
                  method: "POST",
                  credentials: "include",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ price_id: priceId.trim() }),
                });
                const j = await res.json().catch(() => ({}));
                if (!res.ok) toast.error(j.error || "Plan update failed");
                else {
                  toast.success("Subscription price updated");
                  load();
                  loadBilling();
                }
              }}
            >
              Change plan (Stripe)
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={async () => {
                const pi = typeof window !== "undefined" ? window.prompt("Payment intent id (pi_…)") : null;
                if (!pi?.trim()) return;
                const amt = typeof window !== "undefined" ? window.prompt("Amount in pence (blank = full)") : "";
                const res = await fetch(`/api/admin/tenants/${id}/billing/refund`, {
                  method: "POST",
                  credentials: "include",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    payment_intent: pi.trim(),
                    amount: amt?.trim() ? Number(amt.trim()) : undefined,
                  }),
                });
                const j = await res.json().catch(() => ({}));
                if (!res.ok) toast.error(j.error || "Refund failed");
                else toast.success(`Refund ${j.refund_id || "ok"}`);
              }}
            >
              Issue refund
            </Button>
          </div>

          {billingSnap && billingSnap.invoices.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-medium">Invoices</p>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Period</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">PDF</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {billingSnap.invoices.map((inv) => (
                    <TableRow key={inv.id}>
                      <TableCell className="text-sm">
                        {inv.period_start} → {inv.period_end}
                      </TableCell>
                      <TableCell className="font-mono text-sm">£{Number(inv.total_amount_gbp).toFixed(2)}</TableCell>
                      <TableCell className="text-sm capitalize">{inv.status}</TableCell>
                      <TableCell className="text-right">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={async () => {
                            const res = await fetch(`/api/admin/tenants/${id}/invoices/${inv.id}/pdf`, {
                              credentials: "include",
                            });
                            if (!res.ok) {
                              toast.error("Download failed");
                              return;
                            }
                            const blob = await res.blob();
                            const url = URL.createObjectURL(blob);
                            const a = document.createElement("a");
                            a.href = url;
                            a.download = `invoice-${inv.id}.pdf`;
                            a.click();
                            URL.revokeObjectURL(url);
                          }}
                        >
                          Download
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Recent activity (platform audit)</CardTitle>
          <CardDescription>Last 50 actions for this organization</CardDescription>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>When</TableHead>
                <TableHead>Admin</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>IP</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {audit.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-slate-500 text-center py-8">
                    No audit entries yet (run Phase 2 migration for full logging).
                  </TableCell>
                </TableRow>
              ) : (
                audit.map((a) => (
                  <TableRow key={a.id}>
                    <TableCell className="whitespace-nowrap text-sm">
                      {new Date(a.created_at).toLocaleString()}
                    </TableCell>
                    <TableCell className="text-sm">
                      {a.admin_name || a.admin_email || "—"}
                    </TableCell>
                    <TableCell className="text-sm font-mono">{a.action}</TableCell>
                    <TableCell className="text-sm text-slate-600">{a.ip_address || "—"}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

function isoToLocal(iso: string): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function localToIso(local: string): string | null {
  if (!local) return null;
  const d = new Date(local);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString();
}
