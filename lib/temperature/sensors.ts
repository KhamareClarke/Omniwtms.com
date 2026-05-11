import { createAdminServiceClient } from "@/lib/supabase/admin-service";
import { maybeSendTemperatureDeviationAlert } from "@/lib/temperature/alerts";

export type TemperatureReadingInput = {
  tenantId: string;
  deliveryId: string;
  readingC: number;
  deviceId: string;
  at?: string;
  metadata?: Record<string, unknown>;
};

/**
 * Register / associate an IoT device with a monitored delivery (Smartrac, Sensitech, Tempmate-compatible).
 */
export async function registerTemperatureSensor(input: {
  tenantId: string;
  deliveryId: string;
  deviceId: string;
  provider?: string;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const supabase = createAdminServiceClient();
  const { data: d, error } = await supabase
    .from("deliveries")
    .select("id, tenant_id, requires_temperature_monitoring")
    .eq("id", input.deliveryId)
    .eq("tenant_id", input.tenantId)
    .maybeSingle();
  if (error || !d) return { ok: false, error: "delivery not found" };
  const row = d as { requires_temperature_monitoring?: boolean };
  if (!row.requires_temperature_monitoring) {
    await supabase.from("deliveries").update({ requires_temperature_monitoring: true }).eq("id", input.deliveryId);
  }
  return { ok: true };
}

export async function receiveTemperatureReading(
  input: TemperatureReadingInput
): Promise<{ ok: true; within_range: boolean } | { ok: false; error: string }> {
  const supabase = createAdminServiceClient();
  const { data: del, error: dErr } = await supabase
    .from("deliveries")
    .select("id, tenant_id, temp_alert_min_c, temp_alert_max_c, requires_temperature_monitoring, package_id, customer_id")
    .eq("id", input.deliveryId)
    .eq("tenant_id", input.tenantId)
    .maybeSingle();
  if (dErr || !del) return { ok: false, error: "delivery not found" };

  const row = del as {
    temp_alert_min_c?: number | null;
    temp_alert_max_c?: number | null;
    requires_temperature_monitoring?: boolean | null;
    package_id?: string | null;
    customer_id?: string | null;
  };

  const min = row.temp_alert_min_c ?? null;
  const max = row.temp_alert_max_c ?? null;
  let within = true;
  if (min != null && max != null) {
    within = input.readingC >= Number(min) && input.readingC <= Number(max);
  }

  const ts = input.at ?? new Date().toISOString();
  const { error: insErr } = await supabase.from("temperature_readings").insert({
    tenant_id: input.tenantId,
    delivery_id: input.deliveryId,
    reading_value: input.readingC,
    timestamp: ts,
    device_id: input.deviceId,
    within_range: within,
    metadata: input.metadata ?? {},
  });
  if (insErr) return { ok: false, error: insErr.message };

  if (!within) {
    await maybeSendTemperatureDeviationAlert({
      tenantId: input.tenantId,
      deliveryId: input.deliveryId,
      reading: input.readingC,
      min: Number(min ?? 0),
      max: Number(max ?? 0),
      deviceId: input.deviceId,
      packageId: row.package_id ?? input.deliveryId,
      customerId: row.customer_id ?? null,
    });
  }

  return { ok: true, within_range: within };
}

export async function checkTemperatureCompliance(
  tenantId: string,
  deliveryId: string
): Promise<{ compliant: boolean; outOfRangeCount: number; sampleCount: number }> {
  const supabase = createAdminServiceClient();
  const { data, error } = await supabase
    .from("temperature_readings")
    .select("within_range")
    .eq("tenant_id", tenantId)
    .eq("delivery_id", deliveryId);
  if (error || !data?.length) return { compliant: true, outOfRangeCount: 0, sampleCount: 0 };
  const bad = (data as { within_range?: boolean }[]).filter((r) => r.within_range === false).length;
  return { compliant: bad === 0, outOfRangeCount: bad, sampleCount: data.length };
}

export async function generateTemperatureReport(
  tenantId: string,
  deliveryId: string,
  fromIso: string,
  toIso: string
): Promise<{ readings: { t: string; v: number; ok: boolean; device: string }[]; summary: string }> {
  const supabase = createAdminServiceClient();
  const { data, error } = await supabase
    .from("temperature_readings")
    .select("timestamp, reading_value, within_range, device_id")
    .eq("tenant_id", tenantId)
    .eq("delivery_id", deliveryId)
    .gte("timestamp", fromIso)
    .lte("timestamp", toIso)
    .order("timestamp", { ascending: true });
  if (error) return { readings: [], summary: error.message };
  const readings = ((data ?? []) as { timestamp: string; reading_value: number; within_range: boolean; device_id: string }[]).map(
    (r) => ({
      t: r.timestamp,
      v: Number(r.reading_value),
      ok: r.within_range,
      device: r.device_id,
    })
  );
  const c = await checkTemperatureCompliance(tenantId, deliveryId);
  const summary = `${c.sampleCount} samples, ${c.outOfRangeCount} out of range, compliant=${c.compliant}`;
  return { readings, summary };
}
