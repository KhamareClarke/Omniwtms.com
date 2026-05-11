import { NextRequest, NextResponse } from "next/server";
import { requireTenantId } from "@/lib/tenants/context";
import { createAdminServiceClient } from "@/lib/supabase/admin-service";

export async function GET(request: NextRequest) {
  try {
    const t = requireTenantId(request);
    if (t instanceof NextResponse) return t;
    const skuId = request.nextUrl.searchParams.get("sku_id")?.trim();
    const supabase = createAdminServiceClient();
    let query = supabase
      .from("sds_documents")
      .select("*")
      .eq("tenant_id", t.tenantId)
      .order("created_at", { ascending: false });
    if (skuId) query = query.eq("sku_id", skuId);
    const { data, error } = await query.limit(500);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ sds: data ?? [] });
  } catch (e) {
    console.error("hazmat sds GET", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const t = requireTenantId(request);
    if (t instanceof NextResponse) return t;
    const body = (await request.json()) as {
      sku_id?: string | null;
      title?: string;
      storage_path?: string;
      uploaded_by?: string;
    };
    if (!body.title?.trim() || !body.storage_path?.trim()) {
      return NextResponse.json({ error: "title and storage_path required" }, { status: 400 });
    }
    const supabase = createAdminServiceClient();
    const { data, error } = await supabase
      .from("sds_documents")
      .insert({
        tenant_id: t.tenantId,
        sku_id: body.sku_id ?? null,
        title: body.title.trim(),
        storage_path: body.storage_path.trim(),
        uploaded_by: body.uploaded_by ?? "dashboard",
      })
      .select("*")
      .single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data, { status: 201 });
  } catch (e) {
    console.error("hazmat sds POST", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
