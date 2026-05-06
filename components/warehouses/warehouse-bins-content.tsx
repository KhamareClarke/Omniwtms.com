"use client";

import React, { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { supabase } from "@/lib/auth/SupabaseClient";
import { toast } from "sonner";
import { Box, Package, ArrowRight, Plus, HelpCircle, ChevronDown } from "lucide-react";
import { WarehouseBins3DView } from "./warehouse-bins-3d-view";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

interface Bin {
  id: string;
  warehouse_id: string;
  section_id?: string;
  x: number;
  y: number;
  z: number;
  max_quantity: number;
  max_volume: number;
  current_quantity: number;
  current_volume: number;
  bin_code?: string;
  bin_allocations?: { product_id: string; quantity: number; products?: { name: string; sku: string } }[];
}

interface WarehouseBinsContentProps {
  warehouseId: string;
}

export function WarehouseBinsContent({ warehouseId }: WarehouseBinsContentProps) {
  const [bins, setBins] = useState<Bin[]>([]);
  const [products, setProducts] = useState<{ id: string; name: string; sku: string; quantity: number }[]>([]);
  const [loading, setLoading] = useState(true);

  const [createForm, setCreateForm] = useState({
    x: 0,
    y: 0,
    z: 0,
    max_quantity: 100,
    bin_code: "",
  });
  const [allocateForm, setAllocateForm] = useState({
    bin_id: "",
    product_id: "",
    quantity: 1,
  });
  const [moveForm, setMoveForm] = useState({
    from_bin_id: "",
    to_bin_id: "",
    product_id: "",
    quantity: 1,
  });

  const allocateCardRef = useRef<HTMLDivElement>(null);
  const moveCardRef = useRef<HTMLDivElement>(null);

  const loadBins = async () => {
    try {
      const res = await fetch(`/api/warehouse/bins?warehouse_id=${warehouseId}`);
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setBins(data.bins || []);
      } else {
        const msg = data.error || "Failed to load bins";
        if (msg.includes("does not exist") || msg.includes("not found")) {
          toast.error("3D bins tables missing. Run: npx supabase db push");
        } else {
          toast.error(msg);
        }
      }
    } catch (e: any) {
      toast.error(e?.message || "Failed to load bins");
    }
  };

  const loadProducts = async () => {
    try {
      const raw = localStorage.getItem("currentUser");
      if (!raw) return;
      const user = JSON.parse(raw);
      const { data, error } = await supabase
        .from("products")
        .select("id, name, sku, quantity")
        .eq("client_id", user.id)
        .order("name");
      if (error) throw error;
      setProducts(data || []);
    } catch (e: any) {
      console.error("Load products:", e);
    }
  };

  useEffect(() => {
    if (!warehouseId) return;
    setLoading(true);
    Promise.all([loadBins(), loadProducts()]).finally(() => setLoading(false));
  }, [warehouseId]);

  const handleCreateBin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/warehouse/bins", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          warehouse_id: warehouseId,
          x: createForm.x,
          y: createForm.y,
          z: createForm.z,
          max_quantity: createForm.max_quantity || 100,
          bin_code: createForm.bin_code || undefined,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const msg = data.error || data.details || `Create failed (${res.status})`;
        if (msg.includes("does not exist") || msg.includes("relation")) {
          toast.error("3D bins table not found. Run the migration: npx supabase db push");
        } else {
          toast.error(msg);
        }
        return;
      }
      toast.success(`Bin (${createForm.x},${createForm.y},${createForm.z}) created`);
      setCreateForm({ x: 0, y: 0, z: 0, max_quantity: 100, bin_code: "" });
      loadBins();
    } catch (e: any) {
      toast.error(e?.message || "Failed to create bin");
    }
  };

  const handleAllocate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!allocateForm.bin_id || !allocateForm.product_id || allocateForm.quantity < 1) {
      toast.error("Select bin, product, and enter quantity");
      return;
    }
    try {
      const res = await fetch("/api/warehouse/bins/allocate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bin_id: allocateForm.bin_id,
          product_id: allocateForm.product_id,
          quantity: allocateForm.quantity,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || data.details || "Allocate failed");
      toast.success(`Allocated ${allocateForm.quantity} to bin`);
      setAllocateForm({ bin_id: "", product_id: "", quantity: 1 });
      loadBins();
    } catch (e: any) {
      toast.error(e?.message || "Failed to allocate");
    }
  };

  const handleMove = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!moveForm.from_bin_id || !moveForm.to_bin_id || !moveForm.product_id || moveForm.quantity < 1) {
      toast.error("Select source, destination, product, and enter quantity");
      return;
    }
    try {
      const res = await fetch("/api/warehouse/bins/move", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          from_bin_id: moveForm.from_bin_id,
          to_bin_id: moveForm.to_bin_id,
          product_id: moveForm.product_id,
          quantity: moveForm.quantity,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || data.details || "Move failed");
      toast.success(data.message || "Stock moved");
      setMoveForm({ from_bin_id: "", to_bin_id: "", product_id: "", quantity: 1 });
      loadBins();
    } catch (e: any) {
      toast.error(e?.message || "Failed to move");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12 text-gray-500">
        Loading 3D bins...
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Collapsible>
        <Card className="border-[#3456FF]/30">
          <CollapsibleTrigger asChild>
            <button className="w-full flex items-center justify-between p-3 text-left hover:bg-gray-50 dark:hover:bg-gray-800/50 rounded-lg transition-colors group">
              <span className="flex items-center gap-2 font-medium text-[#3456FF]">
                <HelpCircle className="w-4 h-4" />
                How to use 3D Warehouse Grid
              </span>
              <ChevronDown className="w-4 h-4 transition-transform group-data-[state=closed]:-rotate-90" />
            </button>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent className="pt-0 pb-3 text-sm text-gray-600 space-y-2">
              <p><strong>1. Create bins</strong> – Enter X (left-right), Y (front-back), Z (height), max quantity. Click Create Bin.</p>
              <p><strong>2. Allocate products</strong> – Select bin, product, quantity. Click Allocate.</p>
              <p><strong>3. Move stock</strong> – Select from bin, to bin, product, quantity. Click Move.</p>
              <p className="text-xs text-gray-500">From bin only shows bins with stock. Capacity limits are enforced.</p>
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>
      {bins.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Box className="w-4 h-4" />
              3D Warehouse View (from bins)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <WarehouseBins3DView bins={bins} className="w-full" />
          </CardContent>
        </Card>
      )}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Create Bin */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Create Bin (x, y, z)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreateBin} className="space-y-3">
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <Label className="text-xs">X</Label>
                  <Input
                    type="number"
                    min="0"
                    value={createForm.x}
                    onChange={(e) => setCreateForm({ ...createForm, x: parseInt(e.target.value, 10) || 0 })}
                  />
                </div>
                <div>
                  <Label className="text-xs">Y</Label>
                  <Input
                    type="number"
                    value={createForm.y}
                    onChange={(e) => setCreateForm({ ...createForm, y: parseInt(e.target.value) || 0 })}
                  />
                </div>
                <div>
                  <Label className="text-xs">Z</Label>
                  <Input
                    type="number"
                    value={createForm.z}
                    onChange={(e) => setCreateForm({ ...createForm, z: parseInt(e.target.value) || 0 })}
                  />
                </div>
              </div>
              <div>
                <Label className="text-xs">Max quantity</Label>
                <Input
                  type="number"
                  min="1"
                  value={createForm.max_quantity}
                  onChange={(e) => setCreateForm({ ...createForm, max_quantity: parseInt(e.target.value) || 0 })}
                />
              </div>
              <div>
                <Label className="text-xs">Bin code (optional)</Label>
                <Input
                  value={createForm.bin_code}
                  onChange={(e) => setCreateForm({ ...createForm, bin_code: e.target.value })}
                  placeholder="e.g. A1-02"
                />
              </div>
              <Button type="submit" className="w-full bg-gradient-to-r from-[#3456FF] to-[#8763FF] hover:opacity-90 text-white font-medium" size="default">
                Create Bin
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Allocate to Bin */}
        <Card ref={allocateCardRef}>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Package className="w-4 h-4" />
              Allocate to Bin
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAllocate} className="space-y-3">
              <div>
                <Label className="text-xs">Bin</Label>
                <Select value={allocateForm.bin_id} onValueChange={(v) => setAllocateForm({ ...allocateForm, bin_id: v })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select bin" />
                  </SelectTrigger>
                  <SelectContent>
                    {bins.map((b) => (
                      <SelectItem key={b.id} value={b.id}>
                        ({b.x},{b.y},{b.z}) {b.bin_code ? `- ${b.bin_code}` : ""} – {b.current_quantity}/{b.max_quantity}
                      </SelectItem>
                    ))}
                    {bins.length === 0 && <SelectItem value="__none__" disabled>No bins yet</SelectItem>}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Product</Label>
                <Select value={allocateForm.product_id} onValueChange={(v) => setAllocateForm({ ...allocateForm, product_id: v })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select product" />
                  </SelectTrigger>
                  <SelectContent>
                    {products.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.name} ({p.sku}) – {p.quantity ?? 0} available
                      </SelectItem>
                    ))}
                    {products.length === 0 && <SelectItem value="__none__" disabled>No products</SelectItem>}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Quantity</Label>
                <Input
                  type="number"
                  min="1"
                  value={allocateForm.quantity}
                  onChange={(e) => setAllocateForm({ ...allocateForm, quantity: parseInt(e.target.value) || 1 })}
                />
              </div>
              <Button type="submit" className="w-full bg-[#16a34a] hover:bg-[#15803d] text-white font-medium" size="default" disabled={bins.length === 0 || products.length === 0}>
                Allocate
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>

      {/* Move Between Bins */}
      <Card ref={moveCardRef}>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <ArrowRight className="w-4 h-4" />
            Move Between Bins
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleMove} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 items-end">
            <div>
              <Label className="text-xs">From bin (source)</Label>
              <Select value={moveForm.from_bin_id} onValueChange={(v) => setMoveForm({ ...moveForm, from_bin_id: v })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select source bin" />
                </SelectTrigger>
                <SelectContent>
                  {bins.map((b) => {
                    const hasStock = (b.bin_allocations?.length ?? 0) > 0;
                    return (
                      <SelectItem key={b.id} value={b.id} disabled={!hasStock}>
                        ({b.x},{b.y},{b.z}) – {b.current_quantity}/{b.max_quantity}
                        {hasStock ? " ✓" : " (empty)"}
                      </SelectItem>
                    );
                  })}
                  {bins.length === 0 && (
                    <SelectItem value="__none__" disabled>No bins yet</SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">To bin</Label>
              <Select value={moveForm.to_bin_id} onValueChange={(v) => setMoveForm({ ...moveForm, to_bin_id: v })}>
                <SelectTrigger>
                  <SelectValue placeholder="Destination" />
                </SelectTrigger>
                <SelectContent>
                  {bins
                    .filter((b) => b.id !== moveForm.from_bin_id)
                    .map((b) => (
                      <SelectItem key={b.id} value={b.id}>
                        ({b.x},{b.y},{b.z}) – {b.current_quantity}/{b.max_quantity}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Product</Label>
              <Select value={moveForm.product_id} onValueChange={(v) => setMoveForm({ ...moveForm, product_id: v })}>
                <SelectTrigger>
                  <SelectValue placeholder="Product" />
                </SelectTrigger>
                <SelectContent>
                  {products.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name} – {p.quantity ?? 0} available
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Quantity</Label>
              <Input
                type="number"
                min="1"
                value={moveForm.quantity}
                onChange={(e) => setMoveForm({ ...moveForm, quantity: parseInt(e.target.value) || 1 })}
              />
            </div>
            <Button type="submit" className="bg-[#2563eb] hover:bg-[#1d4ed8] text-white font-medium shrink-0" size="default" disabled={bins.length < 2 || products.length === 0}>
              Move
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Bins List */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Box className="w-4 h-4" />
            Bins ({bins.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {bins.length === 0 ? (
            <p className="text-sm text-gray-500 py-4">No bins yet. Create bins above to start 3D spatial allocation.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2">Coordinates</th>
                    <th className="text-left py-2">Code</th>
                    <th className="text-left py-2">Usage</th>
                    <th className="text-left py-2">Products</th>
                    <th className="text-left py-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {bins.map((b) => (
                    <tr key={b.id} className="border-b">
                      <td className="py-2 font-mono">({b.x}, {b.y}, {b.z})</td>
                      <td className="py-2">{b.bin_code || "—"}</td>
                      <td className="py-2">{b.current_quantity} / {b.max_quantity}</td>
                      <td className="py-2">
                        {b.bin_allocations?.length ? (
                          <ul className="list-disc list-inside">
                            {b.bin_allocations.map((a: any) => (
                              <li key={a.id}>{a.products?.name || "Product"} × {a.quantity}</li>
                            ))}
                          </ul>
                        ) : (
                          "—"
                        )}
                      </td>
                      <td className="py-2">
                        <div className="flex gap-2">
                          <Button
                            type="button"
                            size="sm"
                            className="bg-[#16a34a] hover:bg-[#15803d] text-white text-xs h-7"
                            onClick={() => {
                              setAllocateForm((f) => ({ ...f, bin_id: b.id }));
                              allocateCardRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
                            }}
                          >
                            Allocate
                          </Button>
                          {(b.bin_allocations?.length ?? 0) > 0 && (
                            <Button
                              type="button"
                              size="sm"
                              className="bg-[#2563eb] hover:bg-[#1d4ed8] text-white text-xs h-7"
                              onClick={() => {
                                setMoveForm((f) => ({ ...f, from_bin_id: b.id }));
                                moveCardRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
                              }}
                            >
                              Move
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
