import { describe, expect, it } from "vitest";
import { calculateOverageCharges } from "@/lib/billing/usage";

describe("billing overage calculations", () => {
  it("computes base overages correctly", () => {
    const out = calculateOverageCharges(
      { apiCalls: 250000, storageGb: 120, orders: 1600, deliveries: 1700 },
      {
        max_api_calls_per_month: 200000,
        max_storage_gb: 100,
        max_orders_per_month: 1500,
        max_deliveries_per_month: 1500,
      }
    );

    expect(out.apiCallsOver).toBe(50000);
    expect(out.storageOverGb).toBe(20);
    expect(out.ordersOver).toBe(100);
    expect(out.deliveriesOver).toBe(200);
    expect(out.totalGbp).toBeGreaterThan(0);
  });

  it("returns zero overage when under all caps", () => {
    const out = calculateOverageCharges(
      { apiCalls: 10, storageGb: 1, orders: 1, deliveries: 1 },
      {
        max_api_calls_per_month: 1000,
        max_storage_gb: 10,
        max_orders_per_month: 100,
        max_deliveries_per_month: 100,
      }
    );
    expect(out.totalGbp).toBe(0);
  });
});
