"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { MoreHorizontal, Plus, Search } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

type Tenant = {
  id: string;
  name: string;
  admin_email: string | null;
  license_plan: string;
  status: string;
  monthly_cost: number | null;
  created_at: string;
};

const PLANS = ["starter", "professional", "enterprise", "standard"];

export default function AdminTenantsPage() {
  const router = useRouter();
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [planFilter, setPlanFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [searchDebounced, setSearchDebounced] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: "",
    admin_email: "",
    admin_name: "",
    license_plan: "starter",
    license_expires_at: "",
  });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const q = new URLSearchParams({
        status: statusFilter,
        plan: planFilter,
        search: searchDebounced,
      });
      const res = await fetch(`/api/admin/tenants?${q}`, { credentials: "include" });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Failed to load organizations");
        return;
      }
      setTenants(data.tenants || []);
    } catch {
      toast.error("Failed to load organizations");
    } finally {
      setLoading(false);
    }
  }, [statusFilter, planFilter, searchDebounced]);

  useEffect(() => {
    const t = setTimeout(() => setSearchDebounced(search.trim()), 300);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => {
    load();
  }, [load]);

  const patchStatus = async (id: string, status: string, name: string) => {
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
      load();
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Update failed");
    }
  };

  const confirmDelete = async () => {
    if (!deleteId) return;
    try {
      const res = await fetch(`/api/admin/tenants/${deleteId}`, {
        method: "DELETE",
        credentials: "include",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Delete failed");
      toast.success("Organization removed (soft delete)");
      setDeleteId(null);
      load();
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Delete failed");
    }
  };

  const createOrg = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    try {
      const res = await fetch("/api/admin/tenants", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          admin_email: form.admin_email,
          admin_name: form.admin_name || null,
          license_plan: form.license_plan,
          license_expires_at: form.license_expires_at || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Create failed");
      toast.success("Organization created");
      setCreateOpen(false);
      setForm({
        name: "",
        admin_email: "",
        admin_name: "",
        license_plan: "starter",
        license_expires_at: "",
      });
      load();
      if (data.tenant?.id) router.push(`/admin/tenants/${data.tenant.id}`);
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Create failed");
    } finally {
      setCreating(false);
    }
  };

  const statusBadge = (s: string) => {
    const v = s?.toLowerCase();
    if (v === "active") return <Badge className="bg-emerald-600">Active</Badge>;
    if (v === "trial") return <Badge variant="secondary">Trial</Badge>;
    if (v === "suspended") return <Badge variant="destructive">Suspended</Badge>;
    if (v === "expired") return <Badge variant="outline">Expired</Badge>;
    return <Badge variant="outline">{s}</Badge>;
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Organizations</h1>
          <p className="text-slate-600 text-sm mt-1">Manage tenants, plans, and access</p>
        </div>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              New organization
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
            <form onSubmit={createOrg}>
              <DialogHeader>
                <DialogTitle>Create organization</DialogTitle>
                <DialogDescription>Add a tenant record. A unique domain slug is generated automatically.</DialogDescription>
              </DialogHeader>
              <div className="grid gap-3 py-4">
                <div>
                  <Label htmlFor="org-name">Name</Label>
                  <Input
                    id="org-name"
                    value={form.name}
                    onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="org-admin-email">Admin email</Label>
                  <Input
                    id="org-admin-email"
                    type="email"
                    value={form.admin_email}
                    onChange={(e) => setForm((f) => ({ ...f, admin_email: e.target.value }))}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="org-admin-name">Admin name</Label>
                  <Input
                    id="org-admin-name"
                    value={form.admin_name}
                    onChange={(e) => setForm((f) => ({ ...f, admin_name: e.target.value }))}
                  />
                </div>
                <div>
                  <Label>Plan</Label>
                  <Select
                    value={form.license_plan}
                    onValueChange={(v) => setForm((f) => ({ ...f, license_plan: v }))}
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
                <div>
                  <Label htmlFor="org-exp">License expiration (optional)</Label>
                  <Input
                    id="org-exp"
                    type="date"
                    value={form.license_expires_at}
                    onChange={(e) => setForm((f) => ({ ...f, license_expires_at: e.target.value }))}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setCreateOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={creating}>
                  {creating ? "Creating…" : "Create"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex flex-col lg:flex-row gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Search name, email, domain…"
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full lg:w-44">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="trial">Trial</SelectItem>
            <SelectItem value="suspended">Suspended</SelectItem>
            <SelectItem value="expired">Expired</SelectItem>
          </SelectContent>
        </Select>
        <Select value={planFilter} onValueChange={setPlanFilter}>
          <SelectTrigger className="w-full lg:w-44">
            <SelectValue placeholder="Plan" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All plans</SelectItem>
            {PLANS.map((p) => (
              <SelectItem key={p} value={p} className="capitalize">
                {p}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-lg border border-slate-200 bg-white overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Admin email</TableHead>
              <TableHead>Plan</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>MRR</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="w-12 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-12 text-slate-500">
                  Loading…
                </TableCell>
              </TableRow>
            ) : tenants.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-12 text-slate-500">
                  No organizations match your filters
                </TableCell>
              </TableRow>
            ) : (
              tenants.map((t) => (
                <TableRow key={t.id}>
                  <TableCell className="font-medium">{t.name}</TableCell>
                  <TableCell className="text-slate-600">{t.admin_email || "—"}</TableCell>
                  <TableCell className="capitalize">{t.license_plan}</TableCell>
                  <TableCell>{statusBadge(t.status)}</TableCell>
                  <TableCell>
                    {t.monthly_cost != null ? `£${Number(t.monthly_cost).toFixed(2)}` : "—"}
                  </TableCell>
                  <TableCell className="text-slate-600">
                    {new Date(t.created_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" aria-label="Actions">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-56">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuItem asChild>
                          <Link href={`/admin/tenants/${t.id}`}>Edit / details</Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link href={`/admin/tenants/${t.id}`}>View dashboard</Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link href={`/admin/tenants/${t.id}#team`}>Manage users</Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link href={`/admin/audit-logs?tenantId=${t.id}`}>View audit logs</Link>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        {t.status !== "suspended" ? (
                          <DropdownMenuItem
                            onClick={() => patchStatus(t.id, "suspended", t.name)}
                            className="text-amber-700"
                          >
                            Suspend
                          </DropdownMenuItem>
                        ) : (
                          <DropdownMenuItem onClick={() => patchStatus(t.id, "active", t.name)}>
                            Reactivate
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem
                          onClick={() =>
                            toast.message("Impersonation", {
                              description: "Not enabled yet — requires tenant user session bridge.",
                            })
                          }
                        >
                          Impersonate…
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-red-600"
                          onClick={() => setDeleteId(t.id)}
                          disabled={t.id === "a0000001-0000-4000-8000-000000000001"}
                        >
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete organization?</AlertDialogTitle>
            <AlertDialogDescription>
              This soft-deletes the tenant (marks deleted and suspends). Linked data may still reference this
              tenant. This cannot be undone from the UI.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction className="bg-red-600 hover:bg-red-700" onClick={confirmDelete}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
