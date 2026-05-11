import { describe, expect, it } from "vitest";
import { generateLoginCode, hashLoginCode, verifyLoginCode, LOGIN_CODE_LENGTH } from "@/lib/auth/totp";

describe("totp/login codes", () => {
  it("generates numeric code with fixed length", () => {
    const code = generateLoginCode();
    expect(code).toMatch(/^\d+$/);
    expect(code).toHaveLength(LOGIN_CODE_LENGTH);
  });

  it("hashes and verifies code", () => {
    process.env.ADMIN_OTP_HMAC_SECRET = "supersecretkey1234";
    const code = "123456";
    const hash = hashLoginCode(code);
    expect(hash).toHaveLength(64);
    expect(verifyLoginCode(code, hash)).toBe(true);
    expect(verifyLoginCode("123455", hash)).toBe(false);
  });
});
