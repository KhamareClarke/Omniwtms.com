import { ghlRequest } from "./client";
import type { GhlAuth } from "./types";

/** Lightweight check that the PIT can read the location. */
export async function testGhlConnectivity(auth: GhlAuth): Promise<{ ok: boolean; error?: string }> {
  try {
    const res = await ghlRequest(auth.apiKey, `/locations/${encodeURIComponent(auth.locationId)}`, {
      method: "GET",
    });
    const text = await res.text();
    if (!res.ok) return { ok: false, error: `${res.status}: ${text.slice(0, 400)}` };
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) };
  }
}
