"use client";

import { useCallback, useEffect, useMemo, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Download, Search } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

type AuditRow = {
  id: string;
  admin_name: string | null;
  admin_email: string | null;
  action: string;
  tenant_name: string | null;
  tenant_id: string | null;
  resource_type: string;
  details: Record<string, unknown> | null;
  ip_address: string | null;
  created_at: string;
};

const ACTION_PRESETS = [
  "all",
  "tenant.create",
  "tenant.update",
  "tenant.soft_delete",
];

function AuditLogsInner() {
  const searchParams = useSearchParams();
  const initialTenant = searchParams.get("tenantId") || "";

  const [loading, setLoading] = useState(true);
  const [action, setAction] = useState("all");
  const [adminEmail, setAdminEmail] = useState("");
  const [tenantId, setTenantId] = useState(initialTenant);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [search, setSearch] = useState("");
  const [rawRows, setRawRows] = useState<AuditRow[]>([]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const q = new URLSearchParams();
      if (action !== "all") q.set("action", action);
      if (adminEmail.trim()) q.set("admin_email", adminEmail.trim());
      if (tenantId.trim()) q.set("tenant_id", tenantId.trim());
      if (from) q.set("from", new Date(from).toISOString());
      if (to) q.set("to", new Date(to).toISOString());
      q.set("limit", "500");
      const res = await fetch(`/api/admin/platform-audit?${q}`, { credentials: "include" });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Failed to load audit log");
        return;
      }
      if (data.migration_required) {
        toast.message("Run the Phase 2 SQL migration to enable platform audit logging.");
      }
      setRawRows(data.rows || []);
    } catch {
      toast.error("Failed to load audit log");
    } finally {
      setLoading(false);
    }
  }, [action, adminEmail, tenantId, from, to]);

  useEffect(() => {
    load();
  }, [load]);

  const rows = useMemo(() => {
    const s = search.trim().toLowerCase();
    if (!s) return rawRows;
    return rawRows.filter(
      (r) =>
        JSON.stringify(r.details || {}).toLowerCase().includes(s) ||
        String(r.action).toLowerCase().includes(s) ||
        String(r.tenant_name || "").toLowerCase().includes(s)
    );
  }, [rawRows, search]);

  useEffect(() => {
    setTenantId(initialTenant);
  }, [initialTenant]);

  const actionOptions = useMemo(() => {
    const set = new Set(ACTION_PRESETS);
    rawRows.forEach((r) => set.add(r.action));
    return [...set].filter((a) => a !== "all").sort();
  }, [rawRows]);

  const exportCsv = () => {
    const headers = [
      "created_at",
      "admin_name",
      "admin_email",
      "action",
      "tenant_name",
      "tenant_id",
      "resource_type",
      "ip_address",
      "details",
    ];
    const esc = (v: string) => `"${v.replace(/"/g, '""')}"`;
    const lines = [headers.join(",")];
    for (const r of rows) {
      lines.push(
        [
          r.created_at,
          r.admin_name ?? "",
          r.admin_email ?? "",
          r.action,
          r.tenant_name ?? "",
          r.tenant_id ?? "",
          r.resource_type,
          r.ip_address ?? "",
          JSON.stringify(r.details ?? {}),
        ]
          .map((c) => esc(String(c)))
          .join(",")
      );
    }
    const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `platform-audit-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Export started");
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Audit logs</h1>
        <p className="text-slate-600 text-sm mt-1">Platform admin actions across organizations</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
          <CardDescription>Refine results; client-side search applies to JSON details as well.</CardDescription>
        </CardHeader>
        <CardContent className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label>Action</Label>
            <Select value={action} onValueChange={setAction}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All actions</SelectItem>
                {actionOptions.map((a) => (
                  <SelectItem key={a} value={a}>
                    {a}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Admin email contains</Label>
            <Input value={adminEmail} onChange={(e) => setAdminEmail(e.target.value)} placeholder="filter" />
          </div>
          <div className="space-y-2">
            <Label>Organization ID</Label>
            <Input value={tenantId} onChange={(e) => setTenantId(e.target.value)} placeholder="uuid" />
          </div>
          <div className="space-y-2">
            <Label>From</Label>
            <Input type="datetime-local" value={from} onChange={(e) => setFrom(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>To</Label>
            <Input type="datetime-local" value={to} onChange={(e) => setTo(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Search</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
          </div>
        </CardContent>
        <CardContent className="flex flex-wrap gap-2 pt-0">
          <Button onClick={load} variant="secondary">
            Apply filters
          </Button>
          <Button onClick={exportCsv} variant="outline" className="gap-2">
            <Download className="h-4 w-4" />
            Export CSV
          </Button>
        </CardContent>
      </Card>

      <div className="rounded-lg border border-slate-200 bg-white overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Time</TableHead>
              <TableHead>Admin</TableHead>
              <TableHead>Action</TableHead>
              <TableHead>Organization</TableHead>
              <TableHead>Resource</TableHead>
              <TableHead>Details</TableHead>
              <TableHead>IP</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-12 text-slate-500">
                  Loading…
                </TableCell>
              </TableRow>
            ) : rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-12 text-slate-500">
                  No rows match
                </TableCell>
              </TableRow>
            ) : (
              rows.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="whitespace-nowrap text-sm">
                    {new Date(r.created_at).toLocaleString()}
                  </TableCell>
                  <TableCell className="text-sm">
                    <div className="font-medium">{r.admin_name || "—"}</div>
                    <div className="text-slate-500 text-xs">{r.admin_email}</div>
                  </TableCell>
                  <TableCell className="font-mono text-xs">{r.action}</TableCell>
                  <TableCell className="text-sm">{r.tenant_name || r.tenant_id || "—"}</TableCell>
                  <TableCell className="text-sm">{r.resource_type}</TableCell>
                  <TableCell className="text-xs max-w-[240px] truncate" title={JSON.stringify(r.details)}>
                    {JSON.stringify(r.details)}
                  </TableCell>
                  <TableCell className="text-xs text-slate-600">{r.ip_address || "—"}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

export default function AdminAuditLogsPage() {
  return (
    <Suspense fallback={<div className="p-8 text-slate-600">Loading audit logs…</div>}>
      <AuditLogsInner />
    </Suspense>
  );
}
