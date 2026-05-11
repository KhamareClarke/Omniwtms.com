"use client";

import { useCallback, useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

type Rec = { id: string; title: string; body: string; severity: string; category: string };

export default function EmpireOsPage() {
  const [loading, setLoading] = useState(true);
  const [enabled, setEnabled] = useState(false);
  const [webhookConfigured, setWebhookConfigured] = useState(false);
  const [webhookPreview, setWebhookPreview] = useState("");
  const [recs, setRecs] = useState<Rec[]>([]);
  const [metrics, setMetrics] = useState<Record<string, unknown> | null>(null);
  const [sendingId, setSendingId] = useState<string | null>(null);
  const [sendingBacklog, setSendingBacklog] = useState(false);
  const [actingId, setActingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/dashboard/empire-os", { credentials: "include" });
    const json = await res.json();
    if (!res.ok) {
      toast.error(json.error ?? "Failed to load");
      setLoading(false);
      return;
    }
    setEnabled(Boolean(json.enabled));
    setWebhookConfigured(Boolean(json.webhook_configured));
    setWebhookPreview(String(json.webhook_preview ?? ""));
    setRecs(Array.isArray(json.recommendations) ? json.recommendations : []);
    setMetrics(json.metrics && typeof json.metrics === "object" ? json.metrics : null);
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const actOnRec = async (rec: Rec, action: "accepted" | "dismissed" | "snoozed") => {
    setActingId(rec.id);
    const res = await fetch("/api/dashboard/empire-os/recommendations", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        recommendation_id: rec.id,
        action,
        metadata: { title: rec.title, category: rec.category, severity: rec.severity },
      }),
    });
    const json = await res.json();
    setActingId(null);
    if (!res.ok) {
      toast.error(json.error ?? "Failed to record action");
      return;
    }
    setRecs((prev) => prev.filter((r) => r.id !== rec.id));
    toast.success(action === "accepted" ? "Accepted" : action === "dismissed" ? "Dismissed" : "Snoozed");
  };

  const sendOne = async (r: Rec) => {
    setSendingId(r.id);
    const res = await fetch("/api/dashboard/empire-os", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        event: "recommendation.push",
        recommendation_id: r.id,
        payload: {
          title: r.title,
          body: r.body,
          severity: r.severity,
          category: r.category,
        },
      }),
    });
    const json = await res.json();
    setSendingId(null);
    if (!res.ok) {
      toast.error(json.error ?? "Send failed");
      return;
    }
    if (json.sent) toast.success("Sent to Empire OS");
    else toast.message("Not sent", { description: json.error || "Enable feature + webhook URL on tenant" });
  };

  const sendWarehouseBacklog = async () => {
    setSendingBacklog(true);
    const res = await fetch("/api/dashboard/empire-os", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        event: "warehouse_backlog",
        payload: {
          metrics,
          pending_deliveries:
            metrics && typeof metrics === "object"
              ? (metrics as { pending_deliveries?: number }).pending_deliveries
              : undefined,
          active_orders:
            metrics && typeof metrics === "object" ? (metrics as { active_orders?: number }).active_orders : undefined,
        },
      }),
    });
    const json = await res.json();
    setSendingBacklog(false);
    if (!res.ok) {
      toast.error(json.error ?? "Send failed");
      return;
    }
    if (json.sent) toast.success("warehouse_backlog sent");
    else toast.message("Not sent", { description: json.error || "Enable feature + webhook URL on tenant" });
  };

  const sendAll = async () => {
    const res = await fetch("/api/dashboard/empire-os", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        event: "recommendations.bundle",
        payload: { items: recs },
      }),
    });
    const json = await res.json();
    if (!res.ok) {
      toast.error(json.error ?? "Send failed");
      return;
    }
    if (json.sent) toast.success("Bundle sent to Empire OS");
    else toast.message("Not sent", { description: json.error || "Enable feature + webhook URL on tenant" });
  };

  if (loading) {
    return (
      <div className="p-8 text-sm text-muted-foreground">Loading Empire OS…</div>
    );
  }

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Empire OS</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Operational recommendations from analytics. Push selected items to your Empire OS webhook for autonomous
          follow-up (enable under Admin → tenant → Empire OS + set webhook URL in tenant metadata).
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Connection</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div className="flex flex-wrap gap-2 items-center">
            <Badge variant={enabled ? "default" : "secondary"}>Feature {enabled ? "on" : "off"}</Badge>
            <Badge variant={webhookConfigured ? "default" : "destructive"}>
              Webhook {webhookConfigured ? "configured" : "missing"}
            </Badge>
          </div>
          {webhookPreview ? (
            <p className="text-muted-foreground break-all">Endpoint: {webhookPreview}</p>
          ) : (
            <p className="text-muted-foreground">
              Set <code className="text-xs bg-muted px-1 rounded">metadata.empire_os_webhook_url</code> on the tenant
              row (and enable Empire OS) to deliver events.
            </p>
          )}
          <Button variant="outline" size="sm" onClick={() => void load()}>
            Refresh
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Warehouse snapshot</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          {metrics ? (
            <>
              <div className="grid sm:grid-cols-2 gap-2 text-muted-foreground">
                <div>
                  Pending deliveries:{" "}
                  <span className="text-foreground font-medium">
                    {String((metrics as { pending_deliveries?: unknown }).pending_deliveries ?? "—")}
                  </span>
                </div>
                <div>
                  Active orders:{" "}
                  <span className="text-foreground font-medium">
                    {String((metrics as { active_orders?: unknown }).active_orders ?? "—")}
                  </span>
                </div>
                <div>
                  On-time rate:{" "}
                  <span className="text-foreground font-medium">
                    {String((metrics as { on_time_delivery_rate?: unknown }).on_time_delivery_rate ?? "—")}
                  </span>
                </div>
              </div>
              <Button size="sm" variant="secondary" disabled={sendingBacklog} onClick={() => void sendWarehouseBacklog()}>
                {sendingBacklog ? "Sending…" : "Send warehouse_backlog to Empire OS"}
              </Button>
            </>
          ) : (
            <p className="text-muted-foreground">No warehouse metrics for default view (pick a warehouse in Analytics first if needed).</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-2">
          <CardTitle>Recommendations</CardTitle>
          <Button size="sm" onClick={() => void sendAll()} disabled={!recs.length}>
            Send all to webhook
          </Button>
        </CardHeader>
        <CardContent className="space-y-3">
          {!recs.length ? (
            <p className="text-sm text-muted-foreground">No recommendations for the current period.</p>
          ) : (
            recs.map((r) => (
              <div key={r.id} className="border rounded-lg p-4 space-y-2">
                <div className="flex flex-wrap justify-between gap-2 items-start">
                  <div>
                    <div className="font-semibold">{r.title}</div>
                    <div className="text-xs text-muted-foreground">
                      {r.category} · {r.severity}
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={actingId === r.id}
                      onClick={() => void actOnRec(r, "accepted")}
                    >
                      {actingId === r.id ? "Saving…" : "Accept"}
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      disabled={actingId === r.id}
                      onClick={() => void actOnRec(r, "dismissed")}
                    >
                      Dismiss
                    </Button>
                    <Button
                      size="sm"
                      variant="secondary"
                      disabled={sendingId === r.id}
                      onClick={() => void sendOne(r)}
                    >
                      {sendingId === r.id ? "Sending…" : "Send to Empire OS"}
                    </Button>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">{r.body}</p>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
