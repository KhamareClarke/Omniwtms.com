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
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";
import { ArrowLeft, Download, RefreshCw } from "lucide-react";

type ReturnRow = {
  id: string;
  rma_number: string;
  status: string;
  reason: string;
  customer_id: string;
  created_at: string;
  return_items?: { id: string; sku_id: string | null; quantity: number; condition: string }[];
};

export default function ReturnsDashboardPage() {
  const [rows, setRows] = useState<ReturnRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [rejectId, setRejectId] = useState<string | null>(null);
  const [rejectNote, setRejectNote] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/returns", { credentials: "include" });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "Failed to load");
        return;
      }
      setRows(data.returns ?? []);
    } catch {
      toast.error("Network error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const act = async (path: string, body?: object) => {
    const res = await fetch(path, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: body ? JSON.stringify(body) : undefined,
    });
    const data = await res.json();
    if (!res.ok) {
      toast.error(data.error ?? "Action failed");
      return;
    }
    toast.success("Updated");
    await load();
  };

  const submitReject = async () => {
    if (!rejectId) return;
    await act(`/api/returns/${rejectId}/reject`, { note: rejectNote });
    setRejectId(null);
    setRejectNote("");
  };

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Returns &amp; RMA</h1>
          <p className="text-sm text-muted-foreground">Approve, ship, inspect, refund, restock.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="icon" onClick={() => void load()} disabled={loading}>
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </Button>
          <Button variant="outline" asChild>
            <Link href="/dashboard">
              <ArrowLeft className="h-4 w-4 mr-1" />
              Dashboard
            </Link>
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Open returns</CardTitle>
          <CardDescription>Emails fire on create, approve (with label link), reject, receive, refund.</CardDescription>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          {loading ? (
            <p className="text-sm text-muted-foreground">Loading…</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>RMA</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Reason</TableHead>
                  <TableHead>Items</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="font-mono text-xs">{r.rma_number}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">{r.status}</Badge>
                    </TableCell>
                    <TableCell className="max-w-[200px] truncate text-xs">{r.reason}</TableCell>
                    <TableCell className="text-xs">{r.return_items?.length ?? 0}</TableCell>
                    <TableCell className="text-right space-x-1 flex flex-wrap justify-end gap-1">
                      <Button size="sm" variant="outline" asChild>
                        <a href={`/api/returns/${r.id}/label`} target="_blank" rel="noreferrer">
                          <Download className="h-3 w-3 mr-1" />
                          Label
                        </a>
                      </Button>
                      {r.status === "pending" ? (
                        <>
                          <Button size="sm" onClick={() => void act(`/api/returns/${r.id}/approve`)}>
                            Approve
                          </Button>
                          <Button size="sm" variant="destructive" onClick={() => setRejectId(r.id)}>
                            Reject
                          </Button>
                        </>
                      ) : null}
                      {r.status === "approved" ? (
                        <Button size="sm" variant="secondary" onClick={() => void act(`/api/returns/${r.id}/label-sent`)}>
                          Label sent
                        </Button>
                      ) : null}
                      {["approved", "label_sent"].includes(r.status) ? (
                        <Button size="sm" onClick={() => void act(`/api/returns/${r.id}/transit`)}>
                          In transit
                        </Button>
                      ) : null}
                      {["approved", "label_sent", "in_transit"].includes(r.status) ? (
                        <Button size="sm" onClick={() => void act(`/api/returns/${r.id}/receive`)}>
                          Received
                        </Button>
                      ) : null}
                      {r.status === "received" ? (
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() =>
                            void act(`/api/returns/${r.id}/inspect`, {
                              lines: (r.return_items ?? []).map((it) => ({
                                return_item_id: it.id,
                                condition: it.condition,
                                inspection_notes: "Checked",
                              })),
                            })
                          }
                        >
                          Inspect
                        </Button>
                      ) : null}
                      {r.status === "inspecting" ? (
                        <>
                          <Button
                            size="sm"
                            onClick={() => {
                              const ref = window.prompt("Refund reference / transaction id?");
                              if (ref) void act(`/api/returns/${r.id}/refund`, { reference: ref });
                            }}
                          >
                            Refund
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => void act(`/api/returns/${r.id}/restock`)}>
                            Restock
                          </Button>
                        </>
                      ) : null}
                      {["refunded", "restocked"].includes(r.status) ? (
                        <Button size="sm" variant="ghost" onClick={() => void act(`/api/returns/${r.id}/close`)}>
                          Close
                        </Button>
                      ) : null}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {rejectId ? (
        <Card>
          <CardHeader>
            <CardTitle>Reject return</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 max-w-md">
            <div>
              <Label>Note to customer</Label>
              <Textarea value={rejectNote} onChange={(e) => setRejectNote(e.target.value)} rows={3} />
            </div>
            <div className="flex gap-2">
              <Button onClick={() => void submitReject()}>Submit rejection</Button>
              <Button variant="ghost" onClick={() => setRejectId(null)}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
