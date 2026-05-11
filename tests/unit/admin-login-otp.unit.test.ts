import { describe, expect, it, vi } from "vitest";

vi.mock("next/headers", () => {
  const cookieSet = vi.fn();
  return {
    cookies: async () => ({
      set: cookieSet,
    }),
    __cookieSet: cookieSet,
  };
});

vi.mock("@/lib/auth/admin", () => ({
  findAdminByEmail: vi.fn(async () => ({
    id: "admin-1",
    email: "admin@example.com",
    name: "Admin",
  })),
  verifyLoginChallengeAndConsume: vi.fn(async () => true),
  resetFailedLoginAttempts: vi.fn(async () => {}),
  recordSuccessfulLogin: vi.fn(async () => {}),
}));

vi.mock("@/lib/auth/admin-session", () => ({
  ADMIN_SESSION_COOKIE: "omni_admin",
  ADMIN_SESSION_MAX_AGE_SEC: 3600,
  signAdminSession: vi.fn(async () => "signed-token"),
}));

describe("admin verify OTP route", () => {
  it("creates admin session after valid challenge", async () => {
    const { POST } = await import("@/app/api/auth/admin/verify-otp/route");
    const req = new Request("http://localhost/api/auth/admin/verify-otp", {
      method: "POST",
      body: JSON.stringify({
        email: "admin@example.com",
        challengeId: "challenge-1",
        code: "123456",
      }),
      headers: { "content-type": "application/json" },
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(body.admin.email).toBe("admin@example.com");
  });
});
