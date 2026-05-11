"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

type Sku = {
  id: string;
  code: string;
  name: string;
  hazmat_class: string | null;
  hazmat_packing_group: string | null;
  hazmat_proper_shipping_name: string | null;
  is_forbidden_air: boolean;
  is_forbidden_sea: boolean;
};

export default function HazmatInventoryPage() {
  const [skus, setSkus] = useState<Sku[]>([]);
  const [sds, setSds] = useState<any[]>([]);
  const [audit, setAudit] = useState<any[]>([]);
  const [selectedSku, setSelectedSku] = useState<string>("");
  const [sdsTitle, setSdsTitle] = useState("");
  const [sdsPath, setSdsPath] = useState("");

  const load = async () => {
    const [skusRes, sdsRes, auditRes] = await Promise.all([
      fetch("/api/skus", { credentials: "include" }),
      fetch("/api/hazmat/sds", { credentials: "include" }),
      fetch("/api/hazmat/audit", { credentials: "include" }),
    ]);
    const skusData = await skusRes.json();
    const sdsData = await sdsRes.json();
    const auditData = await auditRes.json();
    if (skusRes.ok) setSkus(skusData ?? []);
    if (sdsRes.ok) setSds(sdsData.sds ?? []);
    if (auditRes.ok) setAudit(auditData.audit ?? []);
  };

  useEffect(() => {
    void load();
  }, []);

  const uploadSds = async () => {
    const res = await fetch("/api/hazmat/sds", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sku_id: selectedSku || null,
        title: sdsTitle,
        storage_path: sdsPath,
        uploaded_by: "hazmat-dashboard",
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      toast.error(data.error ?? "Failed to add SDS");
      return;
    }
    toast.success("SDS entry saved");
    setSdsTitle("");
    setSdsPath("");
    await load();
  };

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold">Hazmat Inventory & SDS Library</h1>

      <Card>
        <CardHeader>
          <CardTitle>Hazmat SKUs</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {skus
            .filter((s) => s.hazmat_class)
            .map((s) => (
              <div key={s.id} className="border rounded-md p-3 flex flex-wrap gap-2 items-center">
                <span className="font-medium">{s.code}</span>
                <span>{s.name}</span>
                <Badge>{s.hazmat_class}</Badge>
                {s.is_forbidden_air ? <Badge variant="destructive">Air forbidden</Badge> : null}
                {s.is_forbidden_sea ? <Badge variant="destructive">Sea forbidden</Badge> : null}
              </div>
            ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Upload SDS metadata</CardTitle>
        </CardHeader>
        <CardContent className="grid md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>SKU (optional)</Label>
            <select
              className="w-full border rounded-md p-2 text-sm"
              value={selectedSku}
              onChange={(e) => setSelectedSku(e.target.value)}
            >
              <option value="">General SDS (not SKU-bound)</option>
              {skus.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.code} - {s.name}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <Label>Title</Label>
            <Input value={sdsTitle} onChange={(e) => setSdsTitle(e.target.value)} />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label>Storage path / URL</Label>
            <Input value={sdsPath} onChange={(e) => setSdsPath(e.target.value)} placeholder="s3://... or /storage/v1/object/..." />
          </div>
          <div className="md:col-span-2">
            <Button onClick={() => void uploadSds()}>Save SDS record</Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>SDS library</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {sds.map((d) => (
            <div key={d.id} className="border rounded-md p-3 text-sm">
              <div className="font-medium">{d.title}</div>
              <div className="text-muted-foreground break-all">{d.storage_path}</div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Hazmat shipment audit log</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {audit.map((a) => (
            <div key={a.id} className="border rounded-md p-3 text-sm">
              <div className="font-medium">{a.action}</div>
              <div className="text-xs text-muted-foreground">{new Date(a.created_at).toLocaleString()}</div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
