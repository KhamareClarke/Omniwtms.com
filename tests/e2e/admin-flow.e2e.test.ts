import { describe, expect, it, vi } from "vitest";

const tenantInsertSingle = vi.fn(async () => ({ data: { id: "tenant-1", name: "Org One" }, error: null }));
const tenantUpdateSingle = vi.fn(async () => ({
  data: { id: "tenant-1", email: "owner@org.com", company: "Org One", status: "inactive", created_at: new Date().toISOString() },
  error: null,
}));

vi.mock("next/headers", () => ({
  cookies: async () => ({ set: vi.fn() }),
}));

vi.mock("@/lib/auth/admin", () => ({
  findAdminByEmail: vi.fn(async () => ({ id: "admin-1", email: "admin@omni.com", name: "Admin", status: "active", failed_login_attempts: 0 })),
  isAccountLocked: vi.fn(() => false),
  verifyAdminPassword: vi.fn(async () => true),
  upgradeLegacyPasswordIfNeeded: vi.fn(async () => {}),
  createLoginChallenge: vi.fn(async () => ({ id: "challenge-1", plainCode: "123456" })),
  sendAdminLoginOtpEmail: vi.fn(async () => {}),
  verifyLoginChallengeAndConsume: vi.fn(async () => true),
  resetFailedLoginAttempts: vi.fn(async () => {}),
  recordSuccessfulLogin: vi.fn(async () => {}),
}));

vi.mock("@/lib/auth/admin-session", () => ({
  ADMIN_SESSION_COOKIE: "omni_admin",
  ADMIN_SESSION_MAX_AGE_SEC: 3600,
  signAdminSession: vi.fn(async () => "token"),
}));

vi.mock("@/lib/auth/require-admin-api", () => ({
  getVerifiedAdminFromRequest: vi.fn(async () => ({ id: "admin-1", email: "admin@omni.com", name: "Admin" })),
}));

vi.mock("@/lib/admin/write-audit", () => ({
  writePlatformAudit: vi.fn(async () => {}),
}));

vi.mock("@/lib/stripe/client", () => ({
  hasStripeSecretKey: vi.fn(() => false),
  createCustomer: vi.fn(),
  createSubscription: vi.fn(),
}));

vi.mock("@/lib/supabase/admin-service", () => ({
  createAdminServiceClient: () => ({
    from: (table: string) => {
      if (table === "tenants") {
        return {
          insert: () => ({ select: () => ({ single: tenantInsertSingle }) }),
        };
      }
      if (table === "clients") {
        return {
          select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: { id: "tenant-1" } }) }) }),
          update: () => ({ eq: () => ({ select: () => ({ single: tenantUpdateSingle }) }) }),
        };
      }
      return { select: () => ({ order: async () => ({ data: [], error: null }) }) };
    },
  }),
}));

describe("admin e2e flow", () => {
  it("login -> create org -> suspend org", async () => {
    const { POST: verifyPassword } = await import("@/app/api/auth/admin/verify-password/route");
    const { POST: verifyOtp } = await import("@/app/api/auth/admin/verify-otp/route");
    const { POST: createTenant } = await import("@/app/api/admin/tenants/route");
    const { PATCH: suspendOrg } = await import("@/app/api/admin/tenants/[id]/route");

    const pwRes = await verifyPassword(
      new Request("http://localhost/api/auth/admin/verify-password", {
        method: "POST",
        body: JSON.stringify({ email: "admin@omni.com", password: "secret" }),
        headers: { "content-type": "application/json" },
      })
    );
    expect(pwRes.status).toBe(200);

    const otpRes = await verifyOtp(
      new Request("http://localhost/api/auth/admin/verify-otp", {
        method: "POST",
        body: JSON.stringify({ email: "admin@omni.com", challengeId: "challenge-1", code: "123456" }),
        headers: { "content-type": "application/json" },
      })
    );
    expect(otpRes.status).toBe(200);

    const createRes = await createTenant({
      json: async () => ({ name: "Org One", admin_email: "owner@org.com", license_plan: "starter" }),
      nextUrl: new URL("http://localhost/api/admin/tenants"),
    } as any);
    expect(createRes.status).toBe(200);

    const suspendRes = await suspendOrg(
      { json: async () => ({ status: "suspended" }) } as any,
      { params: Promise.resolve({ id: "tenant-1" }) } as any
    );
    expect(suspendRes.status).toBe(200);
  });
});
