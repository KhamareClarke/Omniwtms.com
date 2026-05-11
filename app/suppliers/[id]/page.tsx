"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";

type PoItem = {
  id?: string;
  quantity?: number;
  unit_price?: number;
  total?: number;
  skus?: { name?: string | null; code?: string | null } | null;
};

type Po = {
  id: string;
  po_number?: string | null;
  status: string;
  order_date?: string | null;
  delivery_date?: string | null;
  total_amount?: number | null;
  notes?: string | null;
  po_items?: PoItem[] | null;
};

export default function SupplierDetailPage() {
  const params = useParams<{ id: string }>();
  const id = String(params?.id ?? "");
  const [data, setData] = useState<any>(null);
  const [items, setItems] = useState<any[]>([]);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [confirmPo, setConfirmPo] = useState<Po | null>(null);
  const [deliveryDate, setDeliveryDate] = useState("");
  const [invoiceRef, setInvoiceRef] = useState("");
  const [supplierNotes, setSupplierNotes] = useState("");
  const [docUrl, setDocUrl] = useState("");

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
      body:
        action === "delivered"
          ? JSON.stringify({ status: "delivered" })
          : undefined,
    });
    const j = await res.json();
    if (!res.ok) {
      toast.error(j.error ?? "Action failed");
      return;
    }
    toast.success("Updated");
    await load();
  };

  const submitDeliveryDetails = async () => {
    if (!confirmPo) return;
    const res = await fetch(`/api/suppliers/purchase-orders/${confirmPo.id}/delivery-update`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        status: "delivered",
        delivery_date: deliveryDate || null,
        invoice_reference: invoiceRef || null,
        supplier_notes: supplierNotes || null,
        confirmation_document_url: docUrl || null,
      }),
    });
    const j = await res.json();
    if (!res.ok) {
      toast.error(j.error ?? "Update failed");
      return;
    }
    toast.success("Delivery recorded");
    setConfirmPo(null);
    setDeliveryDate("");
    setInvoiceRef("");
    setSupplierNotes("");
    setDocUrl("");
    await load();
  };

  if (!data) return <div className="p-8">Loading…</div>;

  const pos: Po[] = (data.purchase_orders ?? []) as Po[];

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">{data.supplier.name}</h1>
          <p className="text-sm text-muted-foreground">
            {data.supplier.contact_email ?? "—"} · {data.supplier.phone ?? "—"}
          </p>
        </div>
        <Button variant="outline" onClick={() => void load()}>
          Refresh
        </Button>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>On-time %</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-bold">{data.metrics.on_time_pct}%</CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Delivered POs</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-bold">{data.metrics.delivered}</CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Total POs</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-bold">{data.metrics.total_pos}</CardContent>
        </Card>
      </div>

      <Tabs defaultValue="orders">
        <TabsList className="flex flex-wrap h-auto gap-1">
          <TabsTrigger value="orders">Purchase orders</TabsTrigger>
          <TabsTrigger value="procurement">New PO (org)</TabsTrigger>
          <TabsTrigger value="documents">Documents & notes</TabsTrigger>
        </TabsList>

        <TabsContent value="orders" className="mt-4 space-y-3">
          <Card>
            <CardHeader>
              <CardTitle>Your purchase orders</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {pos.length === 0 ? (
                <p className="text-sm text-muted-foreground">No purchase orders yet.</p>
              ) : (
                pos.map((po) => (
                  <div key={po.id} className="border rounded-lg p-4 space-y-2">
                    <div className="flex flex-wrap justify-between gap-2 items-start">
                      <div>
                        <div className="font-medium">{po.po_number ?? po.id.slice(0, 8)}</div>
                        <div className="text-xs text-muted-foreground">
                          Ordered {po.order_date ?? "—"} · Due {po.delivery_date ?? "—"}
                        </div>
                      </div>
                      <Badge>{po.status}</Badge>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="px-0 h-auto text-primary"
                      onClick={() => setExpanded((e) => (e === po.id ? null : po.id))}
                    >
                      {expanded === po.id ? "Hide line items" : "View line items"}
                    </Button>
                    {expanded === po.id ? (
                      <ul className="text-sm border-t pt-2 space-y-1">
                        {(po.po_items ?? []).length ? (
                          (po.po_items ?? []).map((it, idx) => (
                            <li key={it.id ?? idx} className="flex justify-between gap-2">
                              <span>
                                {it.skus?.name ?? "SKU"} ({it.skus?.code ?? "—"})
                              </span>
                              <span className="text-muted-foreground">
                                ×{it.quantity ?? 0} @ £{Number(it.unit_price ?? 0).toFixed(2)}
                              </span>
                            </li>
                          ))
                        ) : (
                          <li className="text-muted-foreground">No line items returned.</li>
                        )}
                      </ul>
                    ) : null}
                    <div className="flex flex-wrap gap-2 pt-1">
                      {po.status === "sent" ? (
                        <Button size="sm" variant="outline" onClick={() => void supplierAction(po.id, "ack")}>
                          Acknowledge
                        </Button>
                      ) : null}
                      {["acknowledged", "in_transit"].includes(po.status) ? (
                        <>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => void supplierAction(po.id, "delivered")}
                          >
                            Quick mark delivered
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => {
                              setConfirmPo(po);
                              setDeliveryDate(po.delivery_date?.slice(0, 10) ?? "");
                              setInvoiceRef("");
                              setSupplierNotes("");
                              setDocUrl("");
                            }}
                          >
                            Delivery form (invoice + doc)
                          </Button>
                        </>
                      ) : null}
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="procurement" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Create quick PO (organization)</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Uses first SKUs from inventory as placeholders — adjust quantities in the main dashboard if needed.
              </p>
              <Button onClick={() => void createPo()}>Create quick PO</Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="documents" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Notes on file</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <p className="text-muted-foreground">
                Delivery confirmations and supplier notes are appended to each PO when you use the delivery form.
              </p>
              <div className="rounded-md border p-3 max-h-64 overflow-y-auto whitespace-pre-wrap font-mono text-xs">
                {pos
                  .filter((p) => p.notes)
                  .map((p) => (
                    <div key={p.id} className="mb-4">
                      <div className="font-semibold text-foreground mb-1">{p.po_number ?? p.id}</div>
                      {p.notes}
                    </div>
                  ))}
                {!pos.some((p) => p.notes) ? "No notes yet." : null}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={!!confirmPo} onOpenChange={(o) => !o && setConfirmPo(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm delivery — {confirmPo?.po_number ?? confirmPo?.id}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-3 py-2">
            <div className="space-y-2">
              <Label>Delivery date</Label>
              <Input type="date" value={deliveryDate} onChange={(e) => setDeliveryDate(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Invoice reference</Label>
              <Input value={invoiceRef} onChange={(e) => setInvoiceRef(e.target.value)} placeholder="INV-…" />
            </div>
            <div className="space-y-2">
              <Label>Supplier notes</Label>
              <Input value={supplierNotes} onChange={(e) => setSupplierNotes(e.target.value)} placeholder="BOL / carrier" />
            </div>
            <div className="space-y-2">
              <Label>Confirmation document URL</Label>
              <Input
                value={docUrl}
                onChange={(e) => setDocUrl(e.target.value)}
                placeholder="https://… (signed URL or portal link)"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmPo(null)}>
              Cancel
            </Button>
            <Button onClick={() => void submitDeliveryDetails()}>Save & mark delivered</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
