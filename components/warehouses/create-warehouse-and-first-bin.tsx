"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/lib/auth/SupabaseClient";
import { toast } from "sonner";
import { Box, Plus } from "lucide-react";

interface CreateWarehouseAndFirstBinProps {
  onSuccess: (warehouseId: string) => void | Promise<void>;
}

export function CreateWarehouseAndFirstBin({ onSuccess }: CreateWarehouseAndFirstBinProps) {
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    warehouseName: "",
    warehouseLocation: "",
    x: 0,
    y: 0,
    z: 0,
    max_quantity: 100,
    bin_code: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const raw = localStorage.getItem("currentUser");
    if (!raw) {
      toast.error("Please sign in");
      return;
    }
    if (!form.warehouseName.trim() || !form.warehouseLocation.trim()) {
      toast.error("Enter warehouse name and location");
      return;
    }
    try {
      setLoading(true);
      const user = JSON.parse(raw);

      const { data: wh, error: whErr } = await supabase
        .from("warehouses")
        .insert({
          client_id: user.id,
          name: form.warehouseName.trim(),
          location: form.warehouseLocation.trim(),
          capacity: form.max_quantity,
        })
        .select("id")
        .single();

      if (whErr) throw whErr;
      if (!wh?.id) throw new Error("Warehouse not created");

      const binRes = await fetch("/api/warehouse/bins", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          warehouse_id: wh.id,
          x: form.x,
          y: form.y,
          z: form.z,
          max_quantity: form.max_quantity || 100,
          bin_code: form.bin_code || undefined,
        }),
      });
      const binData = await binRes.json().catch(() => ({}));
      if (!binRes.ok) {
        toast.warning(`Warehouse created, but bin failed: ${binData.error || "Unknown"}`);
      } else {
        toast.success("Warehouse and first 3D bin created!");
      }
      await onSuccess(wh.id);
    } catch (e: any) {
      toast.error(e?.message || "Failed to create warehouse");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="border-2 border-[#3456FF]/30 shadow-lg">
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Create Warehouse + First 3D Bin
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4 max-w-lg">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label className="text-xs">Warehouse name</Label>
              <Input
                value={form.warehouseName}
                onChange={(e) => setForm({ ...form, warehouseName: e.target.value })}
                placeholder="e.g. Main Warehouse"
                required
              />
            </div>
            <div>
              <Label className="text-xs">Location / address</Label>
              <Input
                value={form.warehouseLocation}
                onChange={(e) => setForm({ ...form, warehouseLocation: e.target.value })}
                placeholder="e.g. 123 Industrial Ave"
                required
              />
            </div>
          </div>
          <div className="border-t pt-4">
            <p className="text-xs font-medium text-gray-600 mb-2 flex items-center gap-1">
              <Box className="w-3 h-3" />
              First 3D bin coordinates
            </p>
            <div className="grid grid-cols-3 gap-2">
              <div>
                <Label className="text-xs">X</Label>
                <Input
                  type="number"
                  min="0"
                  value={form.x}
                  onChange={(e) => setForm({ ...form, x: parseInt(e.target.value, 10) || 0 })}
                />
              </div>
              <div>
                <Label className="text-xs">Y</Label>
                <Input
                  type="number"
                  min="0"
                  value={form.y}
                  onChange={(e) => setForm({ ...form, y: parseInt(e.target.value, 10) || 0 })}
                />
              </div>
              <div>
                <Label className="text-xs">Z</Label>
                <Input
                  type="number"
                  min="0"
                  value={form.z}
                  onChange={(e) => setForm({ ...form, z: parseInt(e.target.value, 10) || 0 })}
                />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
              <div>
                <Label className="text-xs">Max quantity</Label>
                <Input
                  type="number"
                  min="1"
                  value={form.max_quantity}
                  onChange={(e) => setForm({ ...form, max_quantity: parseInt(e.target.value, 10) || 100 })}
                />
              </div>
              <div>
                <Label className="text-xs">Bin code (optional)</Label>
                <Input
                  value={form.bin_code}
                  onChange={(e) => setForm({ ...form, bin_code: e.target.value })}
                  placeholder="e.g. A1-01"
                />
              </div>
            </div>
          </div>
          <Button type="submit" disabled={loading} size="lg" className="w-full sm:w-auto bg-gradient-to-r from-[#3456FF] to-[#8763FF] hover:opacity-90 text-white font-semibold py-6 px-8 text-base">
            {loading ? "Creating..." : "Create Warehouse & First Bin"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
