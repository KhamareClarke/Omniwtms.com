import type { SupabaseClient } from "@supabase/supabase-js";
import { jsPDF } from "jspdf";
import { createAdminServiceClient } from "@/lib/supabase/admin-service";
import { sendReturnEmail, returnLabelUrl } from "@/lib/returns/notify";
import type { ReturnRow, ReturnStatus } from "@/lib/returns/types";

async function loadReturn(supabase: SupabaseClient, id: string, tenantId: string) {
  const { data, error } = await supabase
    .from("returns")
    .select("*, return_items(*)")
    .eq("id", id)
    .eq("tenant_id", tenantId)
    .maybeSingle();
  if (error || !data) return null;
  return data as ReturnRow & { return_items?: unknown[] };
}

/** PDF shipping label stub (RMA + barcode text). */
export function generateReturnLabelPdf(input: { rma_number: string; customerName: string; address?: string }): Uint8Array {
  const doc = new jsPDF({ unit: "pt", format: "a6" });
  doc.setFontSize(14);
  doc.text("OmniWTMS — Return label", 40, 48);
  doc.setFontSize(11);
  doc.text(`RMA: ${input.rma_number}`, 40, 72);
  doc.text(`Shipper: ${input.customerName}`, 40, 92);
  if (input.address) {
    const lines = doc.splitTextToSize(input.address, 300);
    doc.text(lines, 40, 112);
  }
  doc.setFontSize(9);
  doc.text("* Attach to outer carton. Keep inner packing list inside.", 40, 360);
  const out = doc.output("arraybuffer");
  return new Uint8Array(out);
}

export async function approveReturn(tenantId: string, returnId: string): Promise<{ ok: true } | { ok: false; error: string }> {
  const supabase = createAdminServiceClient();
  const row = await loadReturn(supabase, returnId, tenantId);
  if (!row) return { ok: false, error: "return not found" };
  if (row.status !== "pending") return { ok: false, error: "only pending returns can be approved" };

  const { error } = await supabase.from("returns").update({ status: "approved", updated_at: new Date().toISOString() }).eq("id", returnId);
  if (error) return { ok: false, error: error.message };

  const { data: cust } = await supabase.from("customers").select("name, address").eq("id", row.customer_id).maybeSingle();
  const c = cust as { name?: string; address?: string } | null;

  await sendReturnEmail({
    templateId: "return-approved",
    tenantId,
    customerId: row.customer_id,
    variables: {
      customerName: c?.name ?? "Customer",
      rmaNumber: row.rma_number,
      labelUrl: returnLabelUrl(returnId),
    },
  });

  return { ok: true };
}

export async function rejectReturn(
  tenantId: string,
  returnId: string,
  note: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  const supabase = createAdminServiceClient();
  const row = await loadReturn(supabase, returnId, tenantId);
  if (!row) return { ok: false, error: "return not found" };
  if (row.status !== "pending") return { ok: false, error: "only pending returns can be rejected" };

  const { error } = await supabase
    .from("returns")
    .update({
      status: "rejected" as ReturnStatus,
      rejection_note: note.trim(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", returnId);
  if (error) return { ok: false, error: error.message };

  const { data: cust } = await supabase.from("customers").select("name").eq("id", row.customer_id).maybeSingle();
  const customerName = (cust as { name?: string } | null)?.name ?? "Customer";

  await sendReturnEmail({
    templateId: "return-rejected",
    tenantId,
    customerId: row.customer_id,
    variables: {
      customerName,
      rmaNumber: row.rma_number,
      rejectionReason: note.trim() || "Not specified",
    },
  });

  return { ok: true };
}

export async function markLabelSent(tenantId: string, returnId: string): Promise<{ ok: true } | { ok: false; error: string }> {
  const supabase = createAdminServiceClient();
  const { error } = await supabase
    .from("returns")
    .update({ status: "label_sent", updated_at: new Date().toISOString() })
    .eq("id", returnId)
    .eq("tenant_id", tenantId)
    .in("status", ["approved"]);
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}
