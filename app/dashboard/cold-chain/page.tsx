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
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Line, LineChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { toast } from "sonner";
import { Activity, Download, RefreshCw } from "lucide-react";

type Delivery = {
  id: string;
  package_id: string | null;
  temp_alert_min_c: number | null;
  temp_alert_max_c: number | null;
  requires_temperature_monitoring: boolean;
};

export default function ColdChainPage() {
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [deliveryId, setDeliveryId] = useState<string>("");
  const [series, setSeries] = useState<{ t: string; v: number; ok: boolean }[]>([]);
  const [compliance, setCompliance] = useState<{ compliant: boolean; outOfRangeCount: number; sampleCount: number } | null>(
    null
  );
  const [cfgDelivery, setCfgDelivery] = useState("");
  const [minC, setMinC] = useState("2");
  const [maxC, setMaxC] = useState("8");
  const [monitor, setMonitor] = useState(true);

  const loadDeliveries = useCallback(async () => {
    const res = await fetch("/api/temperature/monitored-deliveries", { credentials: "include" });
    const data = await res.json();
    if (!res.ok) {
      toast.error(data.error ?? "Failed");
      return;
    }
    const list = (data.deliveries ?? []) as Delivery[];
    setDeliveries(list);
    setDeliveryId((prev) => prev || list[0]?.id || "");
  }, []);

  const loadSeries = useCallback(async () => {
    if (!deliveryId) return;
    const res = await fetch(`/api/temperature/series?delivery_id=${encodeURIComponent(deliveryId)}`, {
      credentials: "include",
    });
    const data = await res.json();
    if (!res.ok) {
      toast.error(data.error ?? "Failed");
      return;
    }
    const pts = (data.readings ?? []).map((r: { timestamp: string; reading_value: number; within_range: boolean }) => ({
      t: new Date(r.timestamp).toLocaleTimeString(),
      v: Number(r.reading_value),
      ok: r.within_range,
    }));
    setSeries(pts);
    const cRes = await fetch(`/api/temperature/compliance?delivery_id=${encodeURIComponent(deliveryId)}`, {
      credentials: "include",
    });
    const cData = await cRes.json();
    if (cRes.ok) setCompliance(cData);
  }, [deliveryId]);

  useEffect(() => {
    void loadDeliveries();
  }, [loadDeliveries]);

  useEffect(() => {
    void loadSeries();
    const id = setInterval(() => void loadSeries(), 15000);
    return () => clearInterval(id);
  }, [loadSeries]);

  const saveConfig = async () => {
    if (!cfgDelivery.trim()) {
      toast.error("Enter delivery UUID");
      return;
    }
    const res = await fetch("/api/temperature/delivery-config", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        delivery_id: cfgDelivery.trim(),
        requires_temperature_monitoring: monitor,
        temp_alert_min_c: Number(minC),
        temp_alert_max_c: Number(maxC),
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      toast.error(data.error ?? "Save failed");
      return;
    }
    toast.success("Saved");
    setCfgDelivery("");
    await loadDeliveries();
  };

  const downloadReport = async () => {
    if (!deliveryId) return;
    const to = new Date().toISOString();
    const from = new Date(Date.now() - 7 * 86400000).toISOString();
    const res = await fetch(
      `/api/temperature/report?delivery_id=${encodeURIComponent(deliveryId)}&from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`,
      { credentials: "include" }
    );
    const data = await res.json();
    if (!res.ok) {
      toast.error(data.error ?? "Failed");
      return;
    }
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `temperature-report-${deliveryId.slice(0, 8)}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
    toast.success("Report downloaded");
  };

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Activity className="h-7 w-7 text-sky-600" />
            Cold chain monitoring
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Live readings (poll), compliance, IoT webhook <code className="text-xs">/api/webhooks/temperature-sensor</code>.
          </p>
        </div>
        <Button variant="outline" asChild>
          <Link href="/dashboard">Back</Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Enable monitoring for a delivery</CardTitle>
          <CardDescription>Set °C envelope (defaults 2–8). Supports Smartrac / Sensitech / Tempmate via webhook.</CardDescription>
        </CardHeader>
        <CardContent className="grid md:grid-cols-2 gap-4">
          <div className="space-y-2 md:col-span-2">
            <Label>Delivery ID (UUID)</Label>
            <Input value={cfgDelivery} onChange={(e) => setCfgDelivery(e.target.value)} placeholder="paste delivery id" />
          </div>
          <div className="space-y-2">
            <Label>Min °C</Label>
            <Input value={minC} onChange={(e) => setMinC(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Max °C</Label>
            <Input value={maxC} onChange={(e) => setMaxC(e.target.value)} />
          </div>
          <div className="flex items-center gap-2">
            <Switch checked={monitor} onCheckedChange={setMonitor} id="mon" />
            <Label htmlFor="mon">Requires monitoring</Label>
          </div>
          <div className="flex items-end">
            <Button onClick={() => void saveConfig()}>Save</Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Temperature curve</CardTitle>
              <CardDescription>Updates every 15s</CardDescription>
            </div>
            <div className="flex gap-2">
              <Select value={deliveryId} onValueChange={setDeliveryId}>
                <SelectTrigger className="w-[220px]">
                  <SelectValue placeholder="Delivery" />
                </SelectTrigger>
                <SelectContent>
                  {deliveries.map((d) => (
                    <SelectItem key={d.id} value={d.id}>
                      {d.package_id ?? d.id.slice(0, 8)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button variant="outline" size="icon" onClick={() => void loadSeries()}>
                <RefreshCw className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="icon" onClick={() => void downloadReport()}>
                <Download className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={series}>
                <CartesianGrid strokeDasharray="3 3" className="opacity-40" />
                <XAxis dataKey="t" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} domain={["auto", "auto"]} />
                <Tooltip />
                <Line type="monotone" dataKey="v" stroke="#0ea5e9" strokeWidth={2} dot={false} name="°C" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Compliance</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {compliance ? (
              <>
                <p>
                  Samples: <strong>{compliance.sampleCount}</strong>
                </p>
                <p>
                  Out of range: <strong>{compliance.outOfRangeCount}</strong>
                </p>
                <p>
                  Status:{" "}
                  <strong className={compliance.compliant ? "text-green-600" : "text-amber-600"}>
                    {compliance.compliant ? "OK" : "Review"}
                  </strong>
                </p>
              </>
            ) : (
              <p className="text-muted-foreground">No data</p>
            )}
            <p className="text-xs text-muted-foreground pt-2">
              Configure SKU limits with <code>temp_min_c</code> / <code>temp_max_c</code> on <code>skus</code> (warehouse
              catalog). Delivery envelope overrides monitoring thresholds.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
