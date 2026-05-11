"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function SuppliersPerformancePage() {
  const [rows, setRows] = useState<any[]>([]);

  useEffect(() => {
    fetch("/api/suppliers/performance", { credentials: "include" })
      .then((r) => r.json())
      .then((d) => setRows(d.performance ?? []))
      .catch(() => setRows([]));
  }, []);

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold">Supplier Performance</h1>
      <Card>
        <CardHeader><CardTitle>Ranking</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {rows.map((r, idx) => (
            <div key={r.supplier_id} className="border rounded-md p-3 flex items-center justify-between">
              <div>
                <div className="font-medium">#{idx + 1} {r.name}</div>
                <div className="text-xs text-muted-foreground">
                  Total: {r.total_po} · Delivered: {r.delivered}
                </div>
              </div>
              <Badge>{r.on_time_pct}% on-time</Badge>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
