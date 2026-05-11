import { describe, expect, it, vi } from "vitest";

const eqCalls: Array<{ table: string; col: string; val: unknown }> = [];

function makeQuery(table: string) {
  const query: any = {
    select: vi.fn(() => query),
    eq: vi.fn((col: string, val: unknown) => {
      eqCalls.push({ table, col, val });
      return query;
    }),
    order: vi.fn(async () => ({ data: [], error: null })),
  };
  return query;
}

vi.mock("@/lib/supabase/admin-service", () => ({
  createAdminServiceClient: () => ({
    from: (table: string) => makeQuery(table),
  }),
}));

vi.mock("@/lib/tenants/context", () => ({
  requireTenantId: () => ({ tenantId: "tenant-a", source: "test" }),
}));

vi.mock("@/lib/tenants/validate-actor", () => ({
  assertActorBelongsToTenant: vi.fn(async () => true),
}));

describe("multi-tenant isolation on customer orders", () => {
  it("always scopes queries by tenant_id", async () => {
    eqCalls.length = 0;
    const { GET } = await import("@/app/api/customer/orders/route");
    const req = {
      nextUrl: new URL("http://localhost/api/customer/orders?customer_id=cust-1"),
    } as any;
    const res = await GET(req);
    expect(res.status).toBe(200);

    const tenantScopedTables = ["orders", "simple_orders", "deliveries"];
    for (const table of tenantScopedTables) {
      const hit = eqCalls.find((c) => c.table === table && c.col === "tenant_id" && c.val === "tenant-a");
      expect(hit, `${table} must be tenant-scoped`).toBeTruthy();
    }
  });
});
