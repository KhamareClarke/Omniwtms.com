"use client";

import { useState } from "react";
import { jsPDF } from "jspdf";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

export default function HazmatOrderCheckPage() {
  const [skuId, setSkuId] = useState("");
  const [mode, setMode] = useState<"air" | "road" | "sea">("road");
  const [result, setResult] = useState<any>(null);

  const runCheck = async () => {
    const res = await fetch("/api/hazmat/check", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sku_id: skuId, mode }),
    });
    const data = await res.json();
    if (!res.ok) {
      toast.error(data.error ?? "Check failed");
      return;
    }
    setResult(data);
  };

  const generateDeclaration = () => {
    if (!result) return;
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text("Shipper's Declaration (Hazmat)", 14, 20);
    doc.setFontSize(11);
    doc.text(`SKU ID: ${skuId}`, 14, 36);
    doc.text(`Mode: ${mode}`, 14, 44);
    doc.text(`Deliverable: ${result.canDeliver ? "Yes" : "No"}`, 14, 52);
    doc.text(`Signature required: ${result.requiresSignature ? "Yes" : "No"}`, 14, 60);
    doc.text(`Special handling: ${result.requiresSpecialHandling ? "Yes" : "No"}`, 14, 68);
    doc.text(`Shipper declaration required: ${result.requiresShippersDeclaration ? "Yes" : "No"}`, 14, 76);
    doc.text("Compliance Notes:", 14, 90);
    (result.reasons ?? []).forEach((r: string, idx: number) => doc.text(`- ${r}`, 18, 98 + idx * 8));
    doc.save(`hazmat-declaration-${skuId || "order"}.pdf`);
  };

  return (
    <div className="p-4 md:p-8 max-w-3xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold">Order Hazmat Validation</h1>
      <Card>
        <CardHeader>
          <CardTitle>Validate shipment</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>SKU ID</Label>
            <Input value={skuId} onChange={(e) => setSkuId(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Transport mode</Label>
            <select
              className="w-full border rounded-md p-2 text-sm"
              value={mode}
              onChange={(e) => setMode(e.target.value as any)}
            >
              <option value="road">Road</option>
              <option value="air">Air</option>
              <option value="sea">Sea</option>
            </select>
          </div>
          <Button onClick={() => void runCheck()}>Run compliance check</Button>
          {result ? (
            <div className="space-y-2 border rounded-md p-3">
              <div className="flex gap-2">
                <Badge variant={result.canDeliver ? "default" : "destructive"}>
                  {result.canDeliver ? "Can Deliver" : "Blocked"}
                </Badge>
                {result.requiresSignature ? <Badge>Signature required</Badge> : null}
                {result.requiresSpecialHandling ? <Badge>Special handling</Badge> : null}
              </div>
              {(result.reasons ?? []).map((r: string, i: number) => (
                <div className="text-sm text-muted-foreground" key={i}>
                  {r}
                </div>
              ))}
              <Button variant="outline" onClick={generateDeclaration}>
                Generate declaration PDF
              </Button>
            </div>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
