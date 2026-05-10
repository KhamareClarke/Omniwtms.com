"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";

type Summary = {
  tenant_id: string;
  license_plan: string;
  monthly_cost: unknown;
  next_billing_date: string | null;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  stripe_price_id: string | null;
  billing_cycle_day: number;
  usage: { apiCalls: number; storageGb: number; orders: number; deliveries: number };
  overage: { totalGbp: number };
  invoices: Array<{
    id: string;
    period_start: string;
    period_end: string;
    total_amount_gbp: number;
    status: string;
    created_at: string;
    paid_at?: string | null;
  }>;
};

export default function BillingSettingsPage() {
  const [clientId, setClientId] = useState("");
  const [data, setData] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("currentUser");
      if (raw) {
        const u = JSON.parse(raw);
        if (u?.type === "client" && u?.id) setClientId(u.id);
      }
    } catch {
      /* ignore */
    }
    const inv = typeof window !== "undefined" ? new URLSearchParams(window.location.search).get("invoice") : null;
    if (inv) toast.message("Invoice", { description: `You can download invoice ${inv} from the table below.` });
  }, []);

  useEffect(() => {
    if (!clientId) {
      setLoading(false);
      return;
    }
    fetch(`/api/billing/summary?client_id=${encodeURIComponent(clientId)}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.error) {
          setData(null);
          toast.error(d.error);
          return;
        }
        setData(d as Summary);
      })
      .catch(() => toast.error("Could not load billing"))
      .finally(() => setLoading(false));
  }, [clientId]);

  const openPortal = async () => {
    if (!clientId) return;
    const res = await fetch("/api/billing/portal", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        client_id: clientId,
        return_url: typeof window !== "undefined" ? window.location.href : undefined,
      }),
    });
    const j = await res.json().catch(() => ({}));
    if (!res.ok || !j.url) {
      toast.error(j.error || "Could not open billing portal (Stripe customer may be missing).");
      return;
    }
    window.location.href = j.url as string;
  };

  const downloadPdf = async (invoiceId: string) => {
    if (!clientId) return;
    const res = await fetch(
      `/api/billing/invoices/${encodeURIComponent(invoiceId)}/pdf?client_id=${encodeURIComponent(clientId)}`
    );
    if (!res.ok) {
      toast.error("Download failed");
      return;
    }
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `invoice-${invoiceId}.pdf`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (!clientId && !loading) {
    return (
      <div className="container max-w-2xl py-10 px-4">
        <p className="text-gray-600 mb-4">
          Sign in to the{" "}
          <Link href="/auth/login" className="text-blue-600 underline">
            client dashboard
          </Link>{" "}
          first, then open this page again.
        </p>
        <Link href="/dashboard/settings">
          <Button variant="outline">Back to dashboard settings</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="container max-w-3xl py-10 px-4 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Billing</h1>
        <p className="text-sm text-gray-500 mt-1">
          Tenant <code className="text-xs bg-gray-100 px-1 rounded">{data?.tenant_id || "—"}</code> · Stripe
          customer{" "}
          <code className="text-xs bg-gray-100 px-1 rounded">{data?.stripe_customer_id || "—"}</code>
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Current plan</CardTitle>
          <CardDescription>Synced from your organization tenant record.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p>
            <span className="text-gray-500">Plan:</span>{" "}
            <strong className="capitalize">{data?.license_plan ?? "—"}</strong>
          </p>
          <p>
            <span className="text-gray-500">Monthly cost:</span>{" "}
            <strong>
              £{data?.monthly_cost != null ? Number(data.monthly_cost).toFixed(2) : "—"}
            </strong>
          </p>
          <p>
            <span className="text-gray-500">Next billing:</span>{" "}
            <strong>{data?.next_billing_date ? String(data.next_billing_date).slice(0, 10) : "—"}</strong>
          </p>
          <p>
            <span className="text-gray-500">Billing day (UTC):</span>{" "}
            <strong>{data?.billing_cycle_day ?? "—"}</strong>
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Usage this month</CardTitle>
          <CardDescription>API volume, estimated storage from PODs, orders, and deliveries.</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
          <div>
            <div className="text-gray-500">API calls</div>
            <div className="font-mono text-base">{data?.usage?.apiCalls ?? "—"}</div>
          </div>
          <div>
            <div className="text-gray-500">Storage (GB est.)</div>
            <div className="font-mono text-base">{data?.usage?.storageGb ?? "—"}</div>
          </div>
          <div>
            <div className="text-gray-500">Orders</div>
            <div className="font-mono text-base">{data?.usage?.orders ?? "—"}</div>
          </div>
          <div>
            <div className="text-gray-500">Deliveries</div>
            <div className="font-mono text-base">{data?.usage?.deliveries ?? "—"}</div>
          </div>
          <div className="col-span-full pt-2 border-t">
            <span className="text-gray-500">Overage (current rules):</span>{" "}
            <strong>£{(data?.overage?.totalGbp ?? 0).toFixed(2)}</strong>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Invoices</CardTitle>
          <CardDescription>Monthly statements generated by the platform billing job.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {data?.invoices?.length ? (
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
                {data.invoices.map((inv) => (
                  <TableRow key={inv.id}>
                    <TableCell className="text-sm">
                      {inv.period_start} → {inv.period_end}
                    </TableCell>
                    <TableCell className="font-mono text-sm">£{Number(inv.total_amount_gbp).toFixed(2)}</TableCell>
                    <TableCell className="capitalize text-sm">{inv.status}</TableCell>
                    <TableCell className="text-right">
                      <Button type="button" variant="outline" size="sm" onClick={() => downloadPdf(inv.id)}>
                        Download
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="text-sm text-gray-500">No invoices yet.</p>
          )}
          <div className="flex flex-wrap gap-2">
            <Button type="button" onClick={openPortal}>
              Payment method (Stripe portal)
            </Button>
            <Link href="/settings/notifications">
              <Button variant="outline" type="button">
                Notification settings
              </Button>
            </Link>
            <Link href="/dashboard/settings">
              <Button variant="ghost" type="button">
                Dashboard settings
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
