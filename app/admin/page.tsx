"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AlertTriangle, ArrowRight, Building2, Clock, CreditCard, Server } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";

type StatsPayload = {
  stats: {
    totalOrgs: number;
    activeOrgs: number;
    suspendedOrgs: number;
    trialOrgs: number;
    expiredOrgs: number;
    totalMrr: number;
    totalArr: number;
    systemUptimeLabel: string;
  };
  alerts: {
    licensesExpiringSoon: Array<{
      id: string;
      name: string;
      license_expires_at: string;
      daysLeft: number;
      kind: "expiring" | "expired";
    }>;
    paymentsFailed: Array<{ id: string; message: string }>;
  };
  recentOrganizations: Array<{
    id: string;
    name: string;
    status: string;
    license_plan: string;
    created_at: string;
  }>;
};

export default function AdminOverviewPage() {
  const [data, setData] = useState<StatsPayload | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/admin/stats", { credentials: "include" });
        const j = await res.json();
        if (!res.ok) {
          toast.error(j.error || "Failed to load stats");
          return;
        }
        setData(j);
      } catch {
        toast.error("Failed to load stats");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading || !data) {
    return (
      <div className="flex justify-center py-20 text-slate-600">
        {loading ? "Loading dashboard…" : "No data"}
      </div>
    );
  }

  const { stats, alerts, recentOrganizations } = data;
  const statCards = [
    { label: "Total orgs", value: stats.totalOrgs, icon: Building2 },
    { label: "Active orgs", value: stats.activeOrgs, icon: Building2 },
    { label: "Suspended", value: stats.suspendedOrgs, icon: AlertTriangle },
    { label: "Trial orgs", value: stats.trialOrgs, icon: Clock },
    { label: "Total MRR", value: `£${stats.totalMrr.toLocaleString()}`, icon: CreditCard },
    { label: "Est. ARR", value: `£${stats.totalArr.toLocaleString()}`, icon: CreditCard },
    { label: "System status", value: stats.systemUptimeLabel, icon: Server },
  ];

  const statusBadge = (s: string) => {
    const v = s?.toLowerCase();
    if (v === "active") return <Badge className="bg-emerald-600">Active</Badge>;
    if (v === "trial") return <Badge variant="secondary">Trial</Badge>;
    if (v === "suspended") return <Badge variant="destructive">Suspended</Badge>;
    if (v === "expired") return <Badge variant="outline">Expired</Badge>;
    return <Badge variant="outline">{s}</Badge>;
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Admin dashboard</h1>
        <p className="text-slate-600 mt-1">Platform overview and critical signals</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {statCards.map(({ label, value, icon: Icon }) => (
          <Card key={label}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">{label}</CardTitle>
              <Icon className="h-4 w-4 text-slate-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-semibold text-slate-900">{value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-600" />
            Critical alerts
          </CardTitle>
          <CardDescription>Licenses and billing items that need attention</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {alerts.licensesExpiringSoon.length === 0 && alerts.paymentsFailed.length === 0 ? (
            <p className="text-sm text-slate-600">No critical alerts right now.</p>
          ) : (
            <ul className="space-y-2 text-sm">
              {alerts.licensesExpiringSoon.map((a) => (
                <li
                  key={a.id + a.kind}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2"
                >
                  <span>
                    <strong>{a.name}</strong> —{" "}
                    {a.kind === "expired"
                      ? "License expired"
                      : `License expires in ${a.daysLeft} day(s)`}{" "}
                    ({new Date(a.license_expires_at).toLocaleDateString()})
                  </span>
                  <Button variant="outline" size="sm" asChild>
                    <Link href={`/admin/tenants/${a.id}`}>Manage</Link>
                  </Button>
                </li>
              ))}
              {alerts.paymentsFailed.map((p) => (
                <li key={p.id} className="rounded-lg border border-red-200 bg-red-50 px-3 py-2">
                  {p.message}
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Recent organizations</CardTitle>
            <CardDescription>Latest 10 tenants by created date</CardDescription>
          </div>
          <Button variant="outline" size="sm" asChild>
            <Link href="/admin/tenants">
              View all
              <ArrowRight className="ml-1 h-4 w-4" />
            </Link>
          </Button>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Organization</TableHead>
                <TableHead>Plan</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Registered</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recentOrganizations.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-slate-500 py-8">
                    No organizations yet
                  </TableCell>
                </TableRow>
              ) : (
                recentOrganizations.map((org) => (
                  <TableRow key={org.id}>
                    <TableCell className="font-medium">{org.name}</TableCell>
                    <TableCell className="capitalize">{org.license_plan}</TableCell>
                    <TableCell>{statusBadge(org.status)}</TableCell>
                    <TableCell className="text-slate-600">
                      {new Date(org.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" asChild>
                        <Link href={`/admin/tenants/${org.id}`}>Manage</Link>
                      </Button>
                    </TableCell>
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
