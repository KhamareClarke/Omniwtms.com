import { describe, expect, it, vi } from "vitest";

const sendTemplateEmailMock = vi.fn(async () => ({ ok: true }));

vi.mock("@/lib/email/send", () => ({
  sendTemplateEmail: sendTemplateEmailMock,
}));

vi.mock("@/lib/email/config", () => ({
  isEmailOutgoingConfigured: vi.fn(async () => true),
}));

vi.mock("@/lib/sms/dispatch", () => ({
  maybeSendTenantSms: vi.fn(async () => ({ ok: true })),
}));

vi.mock("@/lib/tenants/context", () => ({
  resolveTenantIdOrDefault: vi.fn(() => "tenant-1"),
}));

vi.mock("@/lib/stripe/ensure-tenant-billing", () => ({
  ensureStripeBillingForTenant: vi.fn(async () => ({ ok: true })),
}));

vi.mock("@/lib/supabase/admin-service", () => ({
  createAdminServiceClient: () => ({
    from: () => ({
      select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: null }) }) }),
      insert: () => ({ select: () => ({ single: async () => ({ data: { id: "client-1" }, error: null }) }) }),
    }),
  }),
}));

describe("organization e2e flow", () => {
  it("signup -> create order -> track delivery/invoice notifications", async () => {
    const { POST: signup } = await import("@/app/api/auth/signup/route");
    const { POST: createOrder } = await import("@/app/api/orders/create/route");

    const signupRes = await signup({
      json: async () => ({
        email: "org@example.com",
        password: "secret",
        company: "Org One",
        tenant_id: "tenant-1",
      }),
    } as any);
    expect(signupRes.status).toBe(200);

    const orderRes = await createOrder({
      json: async () => ({
        customerEmail: "customer@example.com",
        customerName: "Alex",
        orderId: "ORD-1001",
        amount: "89.99",
        currency: "GBP",
        tenant_id: "tenant-1",
      }),
    } as any);
    expect(orderRes.status).toBe(200);

    expect(sendTemplateEmailMock).toHaveBeenCalledWith(
      expect.objectContaining({
        templateId: "org-welcome",
      })
    );
    expect(sendTemplateEmailMock).toHaveBeenCalledWith(
      expect.objectContaining({
        templateId: "order-confirmation",
      })
    );
  });
});
