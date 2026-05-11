import { NextRequest, NextResponse } from "next/server";
import { requireTenantId } from "@/lib/tenants/context";
import { createAdminServiceClient } from "@/lib/supabase/admin-service";
import { evaluateHazmatCompliance, type DeliveryMode } from "@/lib/hazmat/compliance";

export async function POST(request: NextRequest) {
  try {
    const t = requireTenantId(request);
    if (t instanceof NextResponse) return t;
    const body = (await request.json()) as {
      sku_id?: string;
      mode?: DeliveryMode;
      quantity?: number;
      order_id?: string;
      delivery_id?: string;
    };
    if (!body.sku_id) return NextResponse.json({ error: "sku_id required" }, { status: 400 });
    const mode = body.mode ?? "road";

    const supabase = createAdminServiceClient();
    const { data, error } = await supabase
      .from("skus")
      .select(
        "id, code, name, hazmat_class, hazmat_packing_group, hazmat_proper_shipping_name, is_forbidden_air, is_forbidden_sea"
      )
      .eq("id", body.sku_id)
      .eq("tenant_id", t.tenantId)
      .maybeSingle();
    if (error || !data) return NextResponse.json({ error: "SKU not found" }, { status: 404 });

    const result = evaluateHazmatCompliance(data as any, mode);
    if (body.delivery_id) {
      await supabase
        .from("deliveries")
        .update({
          has_hazmat: true,
          requires_signature: result.requiresSignature,
        })
        .eq("id", body.delivery_id)
        .eq("tenant_id", t.tenantId);
    }
    await supabase.from("hazmat_audit_log").insert({
      tenant_id: t.tenantId,
      order_id: body.order_id ?? null,
      delivery_id: body.delivery_id ?? null,
      action: "hazmat_check",
      metadata: {
        sku_id: body.sku_id,
        mode,
        quantity: body.quantity ?? 1,
        result,
      },
    });
    return NextResponse.json(result);
  } catch (e) {
    console.error("hazmat check", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
