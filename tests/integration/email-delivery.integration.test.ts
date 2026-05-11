import { describe, expect, it, vi } from "vitest";

const sendEmailMock = vi.fn(async () => {});
const logNotificationMock = vi.fn(async () => {});

vi.mock("@/lib/email", () => ({
  sendEmail: sendEmailMock,
  loadMailBranding: vi.fn(async () => null),
  brandedEmailHtml: vi.fn((html: string) => html),
}));

vi.mock("@/lib/email/config", () => ({
  isEmailOutgoingConfigured: vi.fn(async () => true),
  useGhlEmail: vi.fn(() => false),
}));

vi.mock("@/lib/notifications/preferences", () => ({
  isEmailEnabledForTenant: vi.fn(async () => true),
}));

vi.mock("@/lib/notifications/log", () => ({
  logNotification: logNotificationMock,
}));

describe("email delivery logging", () => {
  it("logs sent status in notification_logs after template send", async () => {
    const { sendTemplateEmail } = await import("@/lib/email/send");
    const out = await sendTemplateEmail({
      to: "customer@example.com",
      templateId: "delivery-complete",
      variables: { customerName: "Alex", packageId: "PK-1" },
      tenantId: "tenant-1",
    });

    expect(out.ok).toBe(true);
    expect(sendEmailMock).toHaveBeenCalled();
    expect(logNotificationMock).toHaveBeenCalledWith(
      expect.objectContaining({
        tenantId: "tenant-1",
        channel: "email",
        recipient: "customer@example.com",
        status: "sent",
      })
    );
  });
});
