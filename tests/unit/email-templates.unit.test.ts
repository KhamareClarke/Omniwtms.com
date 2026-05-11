import { describe, expect, it } from "vitest";
import { mergeVars } from "@/lib/email/templates/common";
import { buildEmailFromTemplate } from "@/lib/email/templates";

describe("email template variable replacement", () => {
  it("replaces placeholders with values", () => {
    const out = mergeVars("Hello {{name}}, order {{orderId}}", { name: "Alex", orderId: "A-1" });
    expect(out).toBe("Hello Alex, order A-1");
  });

  it("builds template subject/body with injected variables", () => {
    const t = buildEmailFromTemplate(
      "order-confirmation",
      {
        customerName: "Alex",
        orderId: "ORD-42",
        amount: "120.00",
        currency: "GBP",
      },
      "a0000001-0000-4000-8000-000000000001"
    );
    expect(t.subject).toContain("ORD-42");
    expect(t.htmlBody).toContain("Alex");
    expect(t.htmlBody).toContain("120.00");
    expect(t.htmlBody).toContain("GBP");
  });
});
