// @ts-nocheck
"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import CustomerSidebar from "../CustomerSidebar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "react-hot-toast";
import { Badge } from "@/components/ui/badge";

export default function CustomerReturnsPage() {
  const router = useRouter();
  const [customer, setCustomer] = useState<any>(null);
  const [returns, setReturns] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [reason, setReason] = useState("");
  const [selectedOrder, setSelectedOrder] = useState<string>("");
  const [selectedSku, setSelectedSku] = useState<string>("");
  const [qty, setQty] = useState(1);
  const [condition, setCondition] = useState("unopened");

  useEffect(() => {
    const raw = localStorage.getItem("currentCustomer");
    if (!raw) {
      router.push("/auth/login");
      return;
    }
    setCustomer(JSON.parse(raw));
  }, [router]);

  const load = async (cid: string) => {
    const [rRes, oRes] = await Promise.all([
      fetch(`/api/customer/returns?customer_id=${encodeURIComponent(cid)}`, { credentials: "include" }),
      fetch(`/api/customer/orders?customer_id=${encodeURIComponent(cid)}`, { credentials: "include" }),
    ]);
    const rData = await rRes.json();
    const oData = await oRes.json();
    if (rRes.ok) setReturns(rData.returns ?? []);
    if (oRes.ok) {
      const merged = oData.orders ?? [];
      setOrders(merged.filter((o: any) => o._source === "order" || o._source === "simple"));
    }
  };

  useEffect(() => {
    if (!customer?.id) return;
    void load(customer.id);
  }, [customer?.id]);

  const selected = useMemo(() => orders.find((o) => o.id === selectedOrder), [orders, selectedOrder]);

  useEffect(() => {
    const first = selected?.items?.find((i: any) => i.sku_id);
    setSelectedSku(first?.sku_id ? String(first.sku_id) : "");
  }, [selected]);

  const submit = async () => {
    if (!customer?.id) return;
    if (!reason.trim()) {
      toast.error("Please enter a reason");
      return;
    }
    if (!selected) {
      toast.error("Select an order");
      return;
    }
    const body: Record<string, unknown> = {
      customer_id: customer.id,
      reason: reason.trim(),
      items: [
        {
          sku_id: selectedSku || null,
          quantity: Number(qty) || 1,
          condition,
        },
      ],
    };
    if (selected._source === "simple") {
      body.simple_order_id = selected.id;
    } else if (selected._source === "order") {
      body.order_id = selected.id;
      if (!selectedSku) {
        toast.error("Pick a SKU line from the order");
        return;
      }
    } else {
      toast.error("This order type cannot be returned here yet");
      return;
    }

    const res = await fetch("/api/customer/returns", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    if (!res.ok) {
      toast.error(data.error ?? "Failed");
      return;
    }
    toast.success(`Return created: ${data.rma_number}`);
    setReason("");
    await load(customer.id);
  };

  if (!customer) {
    return (
      <div className="flex items-center justify-center h-screen text-gray-600">
        Loading…
      </div>
    );
  }

  const skuOptions =
    selected?.items?.filter((i: any) => i.sku_id) ?? [];

  return (
    <div className="flex min-h-screen bg-gray-50">
      <CustomerSidebar />
      <main className="flex-1 p-6 md:p-10 max-w-3xl space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Returns</h1>
          <p className="text-sm text-gray-600 mt-1">Create a return and track RMA status.</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>New return request</CardTitle>
            <CardDescription>Standard orders need a SKU line. Simple orders may omit SKU.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Order</Label>
              <Select value={selectedOrder} onValueChange={setSelectedOrder}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose order" />
                </SelectTrigger>
                <SelectContent>
                  {orders.map((o) => (
                    <SelectItem key={o.id} value={o.id}>
                      {o.order_number ?? o.id?.slice(0, 8)} ({o._source})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {selected?._source === "order" && skuOptions.length ? (
              <div className="space-y-2">
                <Label>Line / SKU</Label>
                <Select value={selectedSku} onValueChange={setSelectedSku}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select line" />
                  </SelectTrigger>
                  <SelectContent>
                    {skuOptions.map((i: any) => (
                      <SelectItem key={i.id} value={String(i.sku_id)}>
                        {(i.sku_name ?? i.sku_code ?? i.sku_id)?.toString().slice(0, 60)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ) : null}
            <div className="space-y-2">
              <Label>Reason</Label>
              <Textarea value={reason} onChange={(e) => setReason(e.target.value)} rows={3} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Quantity</Label>
                <Input type="number" min={1} value={qty} onChange={(e) => setQty(Number(e.target.value))} />
              </div>
              <div className="space-y-2">
                <Label>Condition</Label>
                <Select value={condition} onValueChange={setCondition}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="unopened">Unopened</SelectItem>
                    <SelectItem value="opened">Opened</SelectItem>
                    <SelectItem value="damaged">Damaged</SelectItem>
                    <SelectItem value="unknown">Unknown</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <Button onClick={() => void submit()}>Submit return</Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Your returns</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {returns.length === 0 ? (
              <p className="text-sm text-gray-500">No returns yet.</p>
            ) : (
              returns.map((r) => (
                <div key={r.id} className="border rounded-lg p-3 flex flex-wrap justify-between gap-2">
                  <div>
                    <div className="font-mono text-sm font-semibold">{r.rma_number}</div>
                    <div className="text-xs text-gray-600">{r.reason}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge>{r.status}</Badge>
                    {["approved", "label_sent", "in_transit"].includes(r.status) ? (
                      <Button variant="outline" size="sm" asChild>
                        <a
                          href={`/api/customer/returns/${r.id}/label?customer_id=${encodeURIComponent(customer.id)}`}
                          target="_blank"
                          rel="noreferrer"
                        >
                          Label PDF
                        </a>
                      </Button>
                    ) : null}
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Link href="/customer" className="text-sm text-blue-600 hover:underline">
          Back to customer home
        </Link>
      </main>
    </div>
  );
}
