import { createAdminServiceClient } from "@/lib/supabase/admin-service";
import { sendTemplateEmail } from "@/lib/email/send";
import { empireOsDispatch, EmpireOSEvents } from "@/lib/integrations/empire-os-dispatch";

export type CreatePOItemInput = {
  sku_id: string;
  quantity: number;
  unit_price: number;
};

export async function createPO(input: {
  tenantId: string;
  supplierId: string;
  deliveryDate?: string | null;
  notes?: string | null;
  items: CreatePOItemInput[];
}): Promise<{ ok: true; poId: string; poNumber: string } | { ok: false; error: string }> {
  const supabase = createAdminServiceClient();
  if (!input.items.length) return { ok: false, error: "At least one item required" };

  const poNumber = `PO-${new Date().toISOString().slice(0, 10).replace(/-/g, "")}-${Math.random().toString(36).slice(2, 7).toUpperCase()}`;
  const total = input.items.reduce((a, b) => a + b.quantity * b.unit_price, 0);

  const { data: po, error } = await supabase
    .from("purchase_orders")
    .insert({
      tenant_id: input.tenantId,
      supplier_id: input.supplierId,
      po_number: poNumber,
      status: "draft",
      delivery_date: input.deliveryDate ?? null,
      total_amount: total,
      notes: input.notes ?? null,
    })
    .select("id")
    .single();
  if (error || !po) return { ok: false, error: error?.message ?? "Failed to create PO" };

  const poId = (po as { id: string }).id;
  const lineItems = input.items.map((i) => ({
    po_id: poId,
    sku_id: i.sku_id,
    quantity: i.quantity,
    unit_price: i.unit_price,
    total: i.quantity * i.unit_price,
  }));
  const { error: liErr } = await supabase.from("po_items").insert(lineItems);
  if (liErr) {
    await supabase.from("purchase_orders").delete().eq("id", poId);
    return { ok: false, error: liErr.message };
  }

  return { ok: true, poId, poNumber };
}

export async function sendPOToSupplier(input: {
  tenantId: string;
  poId: string;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const supabase = createAdminServiceClient();
  const { data, error } = await supabase
    .from("purchase_orders")
    .select("id, po_number, total_amount, suppliers(contact_email, name)")
    .eq("id", input.poId)
    .eq("tenant_id", input.tenantId)
    .maybeSingle();
  if (error || !data) return { ok: false, error: "PO not found" };
  const row = data as {
    po_number: string;
    total_amount: number;
    suppliers?: { contact_email?: string | null; name?: string | null } | null;
  };
  const email = row.suppliers?.contact_email?.trim();
  if (!email) return { ok: false, error: "Supplier has no contact email" };

  await sendTemplateEmail({
    to: email,
    tenantId: input.tenantId,
    templateId: "po-sent",
    variables: {
      customerName: row.suppliers?.name ?? "Supplier",
      poNumber: row.po_number,
      amount: Number(row.total_amount ?? 0).toFixed(2),
      portalUrl: `${process.env.NEXT_PUBLIC_APP_URL ?? ""}/suppliers/portal/login`,
    },
    force: true,
  });

  const { error: updErr } = await supabase
    .from("purchase_orders")
    .update({ status: "sent", updated_at: new Date().toISOString() })
    .eq("id", input.poId)
    .eq("tenant_id", input.tenantId);
  if (updErr) return { ok: false, error: updErr.message };
  return { ok: true };
}

export async function trackPOStatus(input: {
  tenantId: string;
  poId: string;
}): Promise<{ ok: true; status: string } | { ok: false; error: string }> {
  const supabase = createAdminServiceClient();
  const { data, error } = await supabase
    .from("purchase_orders")
    .select("status")
    .eq("id", input.poId)
    .eq("tenant_id", input.tenantId)
    .maybeSingle();
  if (error || !data) return { ok: false, error: "PO not found" };
  return { ok: true, status: String((data as { status?: string }).status ?? "unknown") };
}

export async function autoCreatePOsForLowStock(tenantId: string): Promise<{
  ok: true;
  created: number;
}> {
  const supabase = createAdminServiceClient();
  const { data: inv } = await supabase
    .from("warehouse_inventory")
    .select("product_id, quantity")
    .limit(5000);
  const qtyByProduct = new Map<string, number>();
  for (const r of (inv ?? []) as { product_id?: string; quantity?: number }[]) {
    const pid = String(r.product_id ?? "");
    if (!pid) continue;
    qtyByProduct.set(pid, (qtyByProduct.get(pid) ?? 0) + Number(r.quantity ?? 0));
  }

  const { data: products } = await supabase
    .from("products")
    .select("id, sku")
    .limit(2000);
  const productIds = ((products ?? []) as { id: string }[]).map((p) => p.id);
  if (!productIds.length) return { ok: true, created: 0 };

  const { data: skus } = await supabase
    .from("skus")
    .select("id, code, reorder_point")
    .in("id", productIds)
    .eq("tenant_id", tenantId);
  const low = ((skus ?? []) as { id: string; reorder_point?: number | null }[]).filter((s) => {
    const reorder = Number(s.reorder_point ?? -1);
    if (reorder < 0) return false;
    const current = qtyByProduct.get(s.id) ?? 0;
    return current < reorder;
  });
  if (!low.length) return { ok: true, created: 0 };

  const { data: suppliers } = await supabase
    .from("suppliers")
    .select("id, min_order_qty")
    .eq("tenant_id", tenantId)
    .order("created_at", { ascending: true })
    .limit(1);
  const supplier = (suppliers ?? [])[0] as { id?: string; min_order_qty?: number } | undefined;
  if (!supplier?.id) return { ok: true, created: 0 };

  const items: CreatePOItemInput[] = low.slice(0, 25).map((s) => ({
    sku_id: s.id,
    quantity: Math.max(Number(s.reorder_point ?? 1), Number(supplier.min_order_qty ?? 1)),
    unit_price: 0,
  }));
  const created = await createPO({
    tenantId,
    supplierId: supplier.id,
    items,
    notes: "Auto-generated from low stock reorder point",
  });
  if (!created.ok) return { ok: true, created: 0 };
  empireOsDispatch(tenantId, EmpireOSEvents.INVENTORY_LOW, {
    sku_count: low.length,
    po_id: created.poId,
    po_number: created.poNumber,
    supplier_id: supplier.id,
  });
  return { ok: true, created: 1 };
}
