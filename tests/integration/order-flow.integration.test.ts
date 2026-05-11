import { describe, expect, it, vi } from "vitest";

const sendTemplateEmailMock = vi.fn(async () => ({ ok: true }));
const sendEmailMock = vi.fn(async () => ({}));
const maybeSendTenantSmsMock = vi.fn(async () => ({ ok: true }));

vi.mock("@/lib/email/send", () => ({
  sendTemplateEmail: sendTemplateEmailMock,
}));

vi.mock("@/lib/email/config", () => ({
  isEmailOutgoingConfigured: vi.fn(async () => true),
}));

vi.mock("@/lib/email", () => ({
  sendEmail: sendEmailMock,
  loadMailBranding: vi.fn(async () => null),
  brandedEmailHtml: vi.fn((html: string) => html),
}));

vi.mock("@/lib/sms/dispatch", () => ({
  maybeSendTenantSms: maybeSendTenantSmsMock,
}));

vi.mock("@/lib/events", () => ({
  emitStatusUpdated: vi.fn(),
}));

vi.mock("@/services/listeners/delivery", () => ({}));

vi.mock("@supabase/supabase-js", () => ({
  createClient: () => ({
    from: (table: string) => {
      if (table === "deliveries") {
        return {
          select: () => ({
            eq: () => ({
              single: async () => ({
                data: {
                  id: "del-1",
                  package_id: "PKG-1",
                  status: "out_for_delivery",
                  pod_file: null,
                  shipping_label: null,
                  client_id: "client-1",
                  customer_id: "customer-1",
                  tenant_id: "tenant-1",
                  clients: { email: "org@example.com" },
                  customers: { email: "customer@example.com", name: "Alex", contact_number: "+447700900001" },
                },
                error: null,
              }),
            }),
          }),
        };
      }
      return {
        insert: async () => ({ error: null }),
      };
    },
  }),
}));

describe("order lifecycle integration", () => {
  it("completes delivery update and sends confirmation email", async () => {
    const { POST } = await import("@/app/api/notify-delivery-status/route");
    const req = {
      json: async () => ({
        delivery_id: "del-1",
        new_status: "completed",
        triggered_by: "organization",
      }),
      headers: new Headers(),
    } as any;

    const res = await POST(req);
    expect(res.status).toBe(200);
    expect(sendTemplateEmailMock).toHaveBeenCalledWith(
      expect.objectContaining({
        templateId: "delivery-complete",
      })
    );
  });
});
