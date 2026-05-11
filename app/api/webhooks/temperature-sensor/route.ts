import { NextRequest, NextResponse } from "next/server";
import { createAdminServiceClient } from "@/lib/supabase/admin-service";
import { receiveTemperatureReading } from "@/lib/temperature/sensors";

/**
 * IoT ingestion (Smartrac / Sensitech / Tempmate-style).
 * Authorization: Bearer TEMPERATURE_WEBHOOK_SECRET (optional if unset in dev).
 */
export async function POST(request: NextRequest) {
  try {
    const secret = process.env.TEMPERATURE_WEBHOOK_SECRET?.trim();
    if (secret) {
      const auth = request.headers.get("authorization")?.trim();
      if (auth !== `Bearer ${secret}`) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
    }

    let body: {
      delivery_id?: string;
      tenant_id?: string;
      reading_c?: number;
      device_id?: string;
      timestamp?: string;
      provider?: string;
    };
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }
    if (!body.delivery_id || body.reading_c == null || !body.device_id) {
      return NextResponse.json({ error: "delivery_id, reading_c, device_id required" }, { status: 400 });
    }

    const supabase = createAdminServiceClient();
    let tenantId = body.tenant_id?.trim() ?? "";
    if (!tenantId) {
      const { data: del } = await supabase.from("deliveries").select("tenant_id").eq("id", body.delivery_id).maybeSingle();
      tenantId = (del as { tenant_id?: string } | null)?.tenant_id ?? "";
    }
    if (!tenantId) return NextResponse.json({ error: "tenant not resolved" }, { status: 400 });

    const res = await receiveTemperatureReading({
      tenantId,
      deliveryId: body.delivery_id,
      readingC: Number(body.reading_c),
      deviceId: body.device_id,
      at: body.timestamp,
      metadata: { provider: body.provider ?? "unknown", source: "webhook" },
    });
    if (!res.ok) return NextResponse.json({ error: res.error }, { status: 400 });
    return NextResponse.json({ ok: true, within_range: res.within_range });
  } catch (e) {
    console.error("webhook temperature-sensor", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
