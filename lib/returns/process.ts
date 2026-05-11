import { createAdminServiceClient } from "@/lib/supabase/admin-service";
import { sendReturnEmail } from "@/lib/returns/notify";
import type { ReturnItemCondition } from "@/lib/returns/types";

export async function markReturnInTransit(tenantId: string, returnId: string): Promise<{ ok: true } | { ok: false; error: string }> {
  const supabase = createAdminServiceClient();
  const { error } = await supabase
    .from("returns")
    .update({ status: "in_transit", updated_at: new Date().toISOString() })
    .eq("id", returnId)
    .eq("tenant_id", tenantId)
    .in("status", ["approved", "label_sent"]);
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

export async function markReturnReceived(tenantId: string, returnId: string): Promise<{ ok: true } | { ok: false; error: string }> {
  const supabase = createAdminServiceClient();
  const { data: row } = await supabase.from("returns").select("id, customer_id, rma_number").eq("id", returnId).eq("tenant_id", tenantId).maybeSingle();
  if (!row) return { ok: false, error: "return not found" };

  const { error } = await supabase
    .from("returns")
    .update({ status: "received", updated_at: new Date().toISOString() })
    .eq("id", returnId)
    .eq("tenant_id", tenantId)
    .in("status", ["in_transit", "label_sent", "approved"]);
  if (error) return { ok: false, error: error.message };

  const r = row as { customer_id: string; rma_number: string };
  const { data: cust } = await supabase.from("customers").select("name").eq("id", r.customer_id).maybeSingle();
  const customerName = (cust as { name?: string } | null)?.name ?? "Customer";
  await sendReturnEmail({
    templateId: "return-received",
    tenantId,
    customerId: r.customer_id,
    variables: {
      customerName,
      rmaNumber: r.rma_number,
    },
  });

  return { ok: true };
}

export type InspectLine = {
  return_item_id: string;
  condition: ReturnItemCondition;
  inspection_notes?: string;
};

export async function inspectItems(
  tenantId: string,
  returnId: string,
  lines: InspectLine[]
): Promise<{ ok: true } | { ok: false; error: string }> {
  const supabase = createAdminServiceClient();
  const { data: parent } = await supabase
    .from("returns")
    .select("id, status")
    .eq("id", returnId)
    .eq("tenant_id", tenantId)
    .maybeSingle();
  if (!parent) return { ok: false, error: "return not found" };
  const st = (parent as { status?: string }).status;
  if (st !== "received" && st !== "inspecting") return { ok: false, error: "return must be received before inspection" };

  for (const line of lines) {
    const { error } = await supabase
      .from("return_items")
      .update({
        condition: line.condition,
        inspection_notes: line.inspection_notes ?? null,
      })
      .eq("id", line.return_item_id)
      .eq("return_id", returnId);
    if (error) return { ok: false, error: error.message };
  }

  await supabase.from("returns").update({ status: "inspecting", updated_at: new Date().toISOString() }).eq("id", returnId);
  return { ok: true };
}

export async function issueRefund(
  tenantId: string,
  returnId: string,
  reference: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  const supabase = createAdminServiceClient();
  const { data: row } = await supabase
    .from("returns")
    .select("id, customer_id, rma_number, status")
    .eq("id", returnId)
    .eq("tenant_id", tenantId)
    .maybeSingle();
  if (!row) return { ok: false, error: "return not found" };
  const st = (row as { status?: string }).status;
  if (st !== "inspecting") return { ok: false, error: "complete inspection before refund" };

  const { error } = await supabase
    .from("returns")
    .update({
      status: "refunded",
      refund_reference: reference.trim(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", returnId);
  if (error) return { ok: false, error: error.message };

  const r = row as { customer_id: string; rma_number: string };
  const { data: cust } = await supabase.from("customers").select("name").eq("id", r.customer_id).maybeSingle();
  const customerName = (cust as { name?: string } | null)?.name ?? "Customer";
  await sendReturnEmail({
    templateId: "refund-processed",
    tenantId,
    customerId: r.customer_id,
    variables: {
      customerName,
      rmaNumber: r.rma_number,
      refundReference: reference.trim(),
    },
  });

  return { ok: true };
}

export async function restockItems(tenantId: string, returnId: string): Promise<{ ok: true } | { ok: false; error: string }> {
  const supabase = createAdminServiceClient();
  const { error: u1 } = await supabase.from("return_items").update({ restocked: true }).eq("return_id", returnId);
  if (u1) return { ok: false, error: u1.message };

  const { error } = await supabase
    .from("returns")
    .update({ status: "restocked", updated_at: new Date().toISOString() })
    .eq("id", returnId)
    .eq("tenant_id", tenantId);
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

export async function closeReturn(tenantId: string, returnId: string): Promise<{ ok: true } | { ok: false; error: string }> {
  const supabase = createAdminServiceClient();
  const { error } = await supabase
    .from("returns")
    .update({ status: "closed", updated_at: new Date().toISOString() })
    .eq("id", returnId)
    .eq("tenant_id", tenantId);
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}
