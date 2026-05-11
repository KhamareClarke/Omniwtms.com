"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export default function SupplierDetailPage() {
  const params = useParams<{ id: string }>();
  const id = String(params?.id ?? "");
  const [data, setData] = useState<any>(null);
  const [items, setItems] = useState<any[]>([]);

  const load = async () => {
    if (!id) return;
    const [dRes, skusRes] = await Promise.all([
      fetch(`/api/suppliers/${id}`, { credentials: "include" }),
      fetch("/api/skus", { credentials: "include" }),
    ]);
    const dData = await dRes.json();
    const skus = await skusRes.json();
    if (!dRes.ok) {
      toast.error(dData.error ?? "Failed to load supplier");
      return;
    }
    setData(dData);
    setItems((skus ?? []).slice(0, 5).map((s: any) => ({ sku_id: s.id, quantity: 1, unit_price: 0 })));
  };

  useEffect(() => {
    void load();
  }, [id]);

  const createPo = async () => {
    const res = await fetch(`/api/suppliers/${id}/purchase-orders`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ items }),
    });
    const r = await res.json();
    if (!res.ok) {
      toast.error(r.error ?? "Failed to create PO");
      return;
    }
    toast.success(`PO created: ${r.poNumber}`);
    await load();
  };

  const supplierAction = async (poId: string, action: "ack" | "delivered") => {
    const path =
      action === "ack"
        ? `/api/suppliers/purchase-orders/${poId}/acknowledge`
        : `/api/suppliers/purchase-orders/${poId}/delivery-update`;
    const res = await fetch(path, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: action === "delivered" ? JSON.stringify({ status: "delivered" }) : undefined,
    });
    const data = await res.json();
    if (!res.ok) {
      toast.error(data.error ?? "Action failed");
      return;
    }
    toast.success("Updated");
    await load();
  };

  if (!data) return <div className="p-8">Loading…</div>;

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold">{data.supplier.name}</h1>
      <div className="grid md:grid-cols-3 gap-4">
        <Card>
          <CardHeader><CardTitle>On-time %</CardTitle></CardHeader>
          <CardContent className="text-2xl font-bold">{data.metrics.on_time_pct}%</CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Delivered POs</CardTitle></CardHeader>
          <CardContent className="text-2xl font-bold">{data.metrics.delivered}</CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Total POs</CardTitle></CardHeader>
          <CardContent className="text-2xl font-bold">{data.metrics.total_pos}</CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle>Purchase orders</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {(data.purchase_orders ?? []).map((po: any) => (
            <div key={po.id} className="border rounded-md p-3 flex justify-between items-center">
              <div>
                <div className="font-medium">{po.id.slice(0, 8)}</div>
                <div className="text-xs text-muted-foreground">{po.order_date}</div>
              </div>
              <div className="flex items-center gap-2">
                <Badge>{po.status}</Badge>
                {po.status === "sent" ? (
                  <Button size="sm" variant="outline" onClick={() => void supplierAction(po.id, "ack")}>
                    Acknowledge
                  </Button>
                ) : null}
                {["acknowledged", "in_transit"].includes(po.status) ? (
                  <Button size="sm" variant="outline" onClick={() => void supplierAction(po.id, "delivered")}>
                    Upload delivery confirmation
                  </Button>
                ) : null}
              </div>
            </div>
          ))}
          <Button onClick={() => void createPo()}>Create quick PO</Button>
        </CardContent>
      </Card>
    </div>
  );
}
