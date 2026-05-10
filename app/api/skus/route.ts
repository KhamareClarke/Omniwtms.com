import { NextRequest, NextResponse } from "next/server";
import { createAdminServiceClient } from "@/lib/supabase/admin-service";
import { requireTenantId } from "@/lib/tenants/context";

export async function GET(request: NextRequest) {
  const t = requireTenantId(request);
  if (t instanceof NextResponse) return t;
  try {
    const supabase = createAdminServiceClient();
    const { data, error } = await supabase.from("skus").select("*").eq("tenant_id", t.tenantId);
    if (error) throw error;
    return NextResponse.json(data);
  } catch (error) {
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ error: "An unknown error occurred" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const t = requireTenantId(request);
  if (t instanceof NextResponse) return t;
  try {
    const body = await request.json();
    const supabase = createAdminServiceClient();
    const { data, error } = await supabase
      .from("skus")
      .insert({ ...body, tenant_id: t.tenantId })
      .select();
    if (error) throw error;
    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ error: "An unknown error occurred" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  const t = requireTenantId(request);
  if (t instanceof NextResponse) return t;
  try {
    const body = await request.json();
    const { id, ...updateData } = body;

    if (!id) {
      return NextResponse.json({ error: "ID is required for update" }, { status: 400 });
    }

    const supabase = createAdminServiceClient();
    const { data, error } = await supabase
      .from("skus")
      .update(updateData)
      .eq("id", id)
      .eq("tenant_id", t.tenantId)
      .select();

    if (error) throw error;
    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ error: "An unknown error occurred" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const t = requireTenantId(request);
  if (t instanceof NextResponse) return t;
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "ID is required for deletion" }, { status: 400 });
    }

    const supabase = createAdminServiceClient();
    const { error } = await supabase.from("skus").delete().eq("id", id).eq("tenant_id", t.tenantId);
    if (error) throw error;
    return NextResponse.json({ message: "SKU deleted successfully" }, { status: 200 });
  } catch (error) {
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ error: "An unknown error occurred" }, { status: 500 });
  }
}
