"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { ArrowLeft, Plug, RefreshCw } from "lucide-react";

type Integration = {
  id: string;
  provider: string;
  display_name: string | null;
  shop_identifier: string | null;
  status: string;
  last_sync_at: string | null;
  last_error: string | null;
};

type SyncLog = {
  id: string;
  provider: string;
  level: string;
  action: string;
  detail: Record<string, unknown>;
  created_at: string;
};

export default function EcommerceIntegrationsPage() {
  const [rows, setRows] = useState<Integration[]>([]);
  const [logs, setLogs] = useState<SyncLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [provider, setProvider] = useState("shopify");
  const [shop, setShop] = useState("");
  const [label, setLabel] = useState("");
  const [access, setAccess] = useState("");
  const [refresh, setRefresh] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/dashboard/ecommerce/integrations", { credentials: "include" });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "Failed to load");
        return;
      }
      setRows(data.integrations ?? []);
      setLogs(data.sync_logs ?? []);
    } catch {
      toast.error("Network error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const save = async () => {
    if (!provider) return;
    setSaving(true);
    try {
      const res = await fetch("/api/dashboard/ecommerce/integrations", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider,
          shop_identifier: shop || null,
          display_name: label || null,
          access_token: access || null,
          refresh_token: refresh || null,
          status: "connected",
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "Save failed");
        return;
      }
      toast.success("Integration saved");
      setAccess("");
      setRefresh("");
      await load();
    } catch {
      toast.error("Network error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/dashboard/ecommerce">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Plug className="h-7 w-7" />
            Store integrations
          </h1>
          <p className="text-sm text-muted-foreground">Connect channels, view sync activity (server-side keys).</p>
        </div>
        <Button variant="outline" size="icon" className="ml-auto" onClick={() => void load()} disabled={loading}>
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Add / update connection</CardTitle>
          <CardDescription>
            Shopify: shop domain (e.g. mystore.myshopify.com). WooCommerce: site base URL. Tokens should be rotated via
            your secrets manager in production.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label>Provider</Label>
            <Select value={provider} onValueChange={setProvider}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="shopify">Shopify</SelectItem>
                <SelectItem value="amazon">Amazon</SelectItem>
                <SelectItem value="ebay">eBay</SelectItem>
                <SelectItem value="woocommerce">WooCommerce</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Shop / site identifier</Label>
            <Input value={shop} onChange={(e) => setShop(e.target.value)} placeholder="mystore.myshopify.com" />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label>Display name</Label>
            <Input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Main UK store" />
          </div>
          <div className="space-y-2">
            <Label>Access token / consumer key</Label>
            <Input value={access} onChange={(e) => setAccess(e.target.value)} type="password" autoComplete="off" />
          </div>
          <div className="space-y-2">
            <Label>Refresh token / consumer secret (optional)</Label>
            <Input value={refresh} onChange={(e) => setRefresh(e.target.value)} type="password" autoComplete="off" />
          </div>
          <div className="md:col-span-2">
            <Button onClick={() => void save()} disabled={saving}>
              {saving ? "Saving…" : "Save connection"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Connections</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {loading ? (
            <p className="text-sm text-muted-foreground">Loading…</p>
          ) : rows.length === 0 ? (
            <p className="text-sm text-muted-foreground">No integrations yet.</p>
          ) : (
            rows.map((r) => (
              <div key={r.id} className="flex flex-wrap items-center justify-between gap-2 border rounded-lg p-3">
                <div>
                  <div className="font-medium capitalize">{r.provider}</div>
                  <div className="text-xs text-muted-foreground">{r.shop_identifier ?? "—"}</div>
                  {r.last_error ? (
                    <div className="text-xs text-destructive mt-1">{r.last_error}</div>
                  ) : null}
                </div>
                <div className="text-right text-xs space-y-1">
                  <Badge variant={r.status === "connected" ? "default" : "secondary"}>{r.status}</Badge>
                  <div className="text-muted-foreground">
                    Last sync: {r.last_sync_at ? new Date(r.last_sync_at).toLocaleString() : "—"}
                  </div>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Recent sync activity</CardTitle>
          <CardDescription>Latest 40 events for your organization.</CardDescription>
        </CardHeader>
        <CardContent className="max-h-80 overflow-y-auto text-xs space-y-2">
          {logs.length === 0 ? (
            <p className="text-muted-foreground">No log entries yet.</p>
          ) : (
            logs.map((l) => (
              <div key={l.id} className="border-b pb-2 font-mono">
                <div className="flex justify-between gap-2">
                  <span className="text-foreground">{l.action}</span>
                  <span className="text-muted-foreground shrink-0">
                    {new Date(l.created_at).toLocaleString()}
                  </span>
                </div>
                <div className="text-muted-foreground">
                  {l.provider} · {l.level}
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Webhook URLs (configure in each platform)</CardTitle>
          <CardDescription>Use these HTTPS endpoints on your production domain.</CardDescription>
        </CardHeader>
        <CardContent className="text-xs font-mono space-y-2 break-all">
          <div>/api/webhooks/shopify</div>
          <div>/api/webhooks/amazon</div>
          <div>/api/webhooks/ebay</div>
          <div>/api/webhooks/woocommerce</div>
        </CardContent>
      </Card>
    </div>
  );
}
