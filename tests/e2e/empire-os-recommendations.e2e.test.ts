import { describe, expect, it, vi } from "vitest";

const insertSingle = vi.fn(async () => ({ data: { id: "action-1", created_at: new Date().toISOString() }, error: null }));

vi.mock("@/lib/supabase/admin-service", () => ({
  createAdminServiceClient: () => ({
    from: (table: string) => {
      if (table === "empire_os_recommendation_actions") {
        return {
          insert: (payload: any) => {
            // assert shape in-test via spy calls
            (insertSingle as any).payload = payload;
            return { select: () => ({ single: insertSingle }) };
          },
        };
      }
      return {};
    },
  }),
}));

describe("empire os recommendations", () => {
  it("records accept/dismiss actions", async () => {
    const { POST } = await import("@/app/api/dashboard/empire-os/recommendations/route");

    const req = new Request("http://localhost/api/dashboard/empire-os/recommendations", {
      method: "POST",
      headers: { "content-type": "application/json", "x-tenant-id": "a0000001-0000-4000-8000-000000000001" },
      body: JSON.stringify({
        recommendation_id: "inv-accuracy",
        action: "accepted",
        metadata: { source: "test" },
      }),
    });

    const res = await POST(req as any);
    expect(res.status).toBe(201);
    expect(insertSingle).toHaveBeenCalled();
    expect((insertSingle as any).payload).toEqual(
      expect.objectContaining({
        tenant_id: "a0000001-0000-4000-8000-000000000001",
        recommendation_id: "inv-accuracy",
        action: "accepted",
      })
    );
  });
});

