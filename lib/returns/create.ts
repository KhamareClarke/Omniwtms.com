import { createAdminServiceClient } from "@/lib/supabase/admin-service";
import { assertActorBelongsToTenant } from "@/lib/tenants/validate-actor";
import { generateRmaNumber } from "@/lib/returns/rma";
import { sendReturnEmail } from "@/lib/returns/notify";
import type { ReturnItemInput } from "@/lib/returns/types";

export type CreateReturnInput = {
  tenantId: string;
  customerId: string;
  orderId?: string | null;
  simpleOrderId?: string | null;
  reason: string;
  items: ReturnItemInput[];
};

export type CreateReturnResult =
  | { ok: true; returnId: string; rma_number: string }
  | { ok: false; error: string };

/**
 * Customer (or trusted API) creates an RMA with line items.
 */
export async function createReturn(input: CreateReturnInput): Promise<CreateReturnResult> {
  const supabase = createAdminServiceClient();
  if (!input.reason?.trim()) return { ok: false, error: "reason required" };
  if (!input.items?.length) return { ok: false, error: "at least one item required" };
  if (!input.orderId && !input.simpleOrderId) return { ok: false, error: "orderId or simpleOrderId required" };

  const okActor = await assertActorBelongsToTenant(supabase, "customer", input.customerId, input.tenantId);
  if (!okActor) return { ok: false, error: "customer not in tenant" };

  if (input.orderId) {
    const { data: ord } = await supabase
      .from("orders")
      .select("id, customer_id, tenant_id")
      .eq("id", input.orderId)
      .maybeSingle();
    const o = ord as { id?: string; customer_id?: string | null; tenant_id?: string | null } | null;
    if (!o?.id) return { ok: false, error: "order not found" };
    if ((o.tenant_id ?? input.tenantId) !== input.tenantId) return { ok: false, error: "order tenant mismatch" };
    if (o.customer_id != null && o.customer_id !== input.customerId) {
      return { ok: false, error: "order does not belong to customer" };
    }
  }

  if (input.simpleOrderId) {
    const { data: so } = await supabase
      .from("simple_orders")
      .select("id, customer_id")
      .eq("id", input.simpleOrderId)
      .maybeSingle();
    const s = so as { id?: string; customer_id?: string } | null;
    if (!s?.id) return { ok: false, error: "simple order not found" };
    if (s.customer_id !== input.customerId) return { ok: false, error: "simple order does not belong to customer" };
  }

  const rma_number = generateRmaNumber();
  const { data: ret, error: insErr } = await supabase
    .from("returns")
    .insert({
      tenant_id: input.tenantId,
      order_id: input.orderId ?? null,
      simple_order_id: input.simpleOrderId ?? null,
      customer_id: input.customerId,
      reason: input.reason.trim(),
      status: "pending",
      rma_number,
    })
    .select("id")
    .single();

  if (insErr || !ret) {
    return { ok: false, error: insErr?.message ?? "insert failed" };
  }

  const returnId = (ret as { id: string }).id;
  const rows = input.items.map((it) => ({
    return_id: returnId,
    sku_id: it.sku_id ?? null,
    quantity: it.quantity,
    condition: it.condition,
  }));

  const { error: itemsErr } = await supabase.from("return_items").insert(rows);
  if (itemsErr) {
    await supabase.from("returns").delete().eq("id", returnId);
    return { ok: false, error: itemsErr.message };
  }

  const { data: cust } = await supabase.from("customers").select("name, email").eq("id", input.customerId).maybeSingle();
  const customerName = (cust as { name?: string } | null)?.name ?? "Customer";

  await sendReturnEmail({
    templateId: "return-created",
    tenantId: input.tenantId,
    customerId: input.customerId,
    variables: {
      customerName,
      rmaNumber: rma_number,
      reason: input.reason.trim(),
      returnStatusUrl: `${process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ?? ""}/customer/returns`,
    },
  });

  return { ok: true, returnId, rma_number };
}
