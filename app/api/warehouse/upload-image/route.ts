import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { createAdminServiceClient } from "@/lib/supabase/admin-service";
import { requireTenantId } from "@/lib/tenants/context";
import { warehouseBelongsToTenant } from "@/lib/tenants/warehouse-scope";

const BUCKET_NAME = "warehouse-assets";

export async function POST(request: NextRequest) {
  const t = requireTenantId(request);
  if (t instanceof NextResponse) return t;

  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

    if (!supabaseUrl) {
      return NextResponse.json(
        { error: "Image upload not configured", details: "Add NEXT_PUBLIC_SUPABASE_URL to .env" },
        { status: 503 }
      );
    }

    const formData = await request.formData();
    const file = formData.get("file") as File;
    const warehouseId = formData.get("warehouseId") as string;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }
    if (!warehouseId) {
      return NextResponse.json({ error: "No warehouse ID provided" }, { status: 400 });
    }

    const admin = createAdminServiceClient();
    const okWarehouse = await warehouseBelongsToTenant(admin, warehouseId, t.tenantId);
    if (!okWarehouse) {
      return NextResponse.json({ error: "Warehouse not found" }, { status: 404 });
    }

    const supabase = serviceKey
      ? createClient(supabaseUrl, serviceKey, {
          auth: { autoRefreshToken: false, persistSession: false },
        })
      : createServerClient();

    if (serviceKey) {
      const { data: buckets } = await supabase.storage.listBuckets();
      const bucketExists = buckets?.some((b) => b.name === BUCKET_NAME);
      if (!bucketExists) {
        const { error: createError } = await supabase.storage.createBucket(BUCKET_NAME, {
          public: true,
          fileSizeLimit: 52428800,
          allowedMimeTypes: ["image/png", "image/jpeg", "image/jpg"],
        });
        if (createError) {
          return NextResponse.json(
            { error: "Failed to create bucket", details: createError.message },
            { status: 500 }
          );
        }
      }
    }

    const fileExt = file.name.split(".").pop() || "jpg";
    const fileName = `${warehouseId}-${Date.now()}.${fileExt}`;
    const filePath = `warehouse-layouts/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(filePath, file, { cacheControl: "3600", upsert: false, contentType: file.type });

    if (uploadError) {
      const msg = uploadError.message || "";
      const needServiceKey =
        msg.includes("Bucket") ||
        msg.includes("bucket") ||
        msg.includes("not found") ||
        msg.includes("policy");
      return NextResponse.json(
        {
          error: "Failed to upload image",
          details: needServiceKey
            ? 'Create the "warehouse-assets" bucket in Supabase Dashboard (Storage) or add SUPABASE_SERVICE_ROLE_KEY to .env'
            : msg,
        },
        { status: 500 }
      );
    }

    const { data: urlData } = supabase.storage.from(BUCKET_NAME).getPublicUrl(filePath);
    return NextResponse.json({ success: true, url: urlData.publicUrl, path: filePath });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("Error in upload-image route:", error);
    return NextResponse.json(
      { error: "Internal server error", details: message },
      { status: 500 }
    );
  }
}
