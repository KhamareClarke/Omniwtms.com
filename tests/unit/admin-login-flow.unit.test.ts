import { describe, expect, it, vi } from "vitest";
import bcrypt from "bcrypt";

const updateMock = vi.fn(() => ({ eq: vi.fn(async () => ({})) }));
const fromMock = vi.fn(() => ({ update: updateMock }));

vi.mock("@/lib/supabase/admin-service", () => ({
  createAdminServiceClient: () => ({
    from: fromMock,
  }),
}));

describe("admin login password stage", () => {
  it("verifies bcrypt password and supports legacy plain password", async () => {
    const { verifyAdminPassword } = await import("@/lib/auth/admin");
    const hash = await bcrypt.hash("secret", 10);
    const adminHashed: any = { password_hash: hash, password: null };
    const adminLegacy: any = { password_hash: null, password: "legacy" };

    await expect(verifyAdminPassword(adminHashed, "secret")).resolves.toBe(true);
    await expect(verifyAdminPassword(adminLegacy, "legacy")).resolves.toBe(true);
    await expect(verifyAdminPassword(adminHashed, "wrong")).resolves.toBe(false);
  });

  it("upgrades legacy password hash when missing", async () => {
    const { upgradeLegacyPasswordIfNeeded } = await import("@/lib/auth/admin");
    const admin: any = { password_hash: null, password: "old-pass" };
    await upgradeLegacyPasswordIfNeeded("admin-1", "old-pass", admin);
    expect(fromMock).toHaveBeenCalledWith("admins");
    expect(updateMock).toHaveBeenCalled();
  });
});
