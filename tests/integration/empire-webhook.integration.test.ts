import { describe, expect, it, vi } from "vitest";

const maybeSingleMock = vi.fn(async () => ({
  data: {
    feature_empire_os: true,
    metadata: { empire_os_webhook_url: "https://example.com/empire-webhook" },
  },
  error: null,
}));

vi.mock("@/lib/supabase/admin-service", () => ({
  createAdminServiceClient: () => ({
    from: () => ({
      select: () => ({
        eq: () => ({
          maybeSingle: maybeSingleMock,
        }),
      }),
    }),
  }),
}));

describe("Empire OS webhook dispatch", () => {
  it("sends outbound webhook payload for enabled tenant", async () => {
    const fetchMock = vi.fn(async () => ({ ok: true, status: 200 }));
    vi.stubGlobal("fetch", fetchMock);
    const { sendEmpireOSEvent } = await import("@/lib/integrations/empire-os");
    const out = await sendEmpireOSEvent({
      tenantId: "tenant-1",
      event: "delivery.completed",
      payload: { deliveryId: "del-1" },
    });

    expect(out.sent).toBe(true);
    expect(fetchMock).toHaveBeenCalledWith(
      "https://example.com/empire-webhook",
      expect.objectContaining({
        method: "POST",
      })
    );
  });
});
