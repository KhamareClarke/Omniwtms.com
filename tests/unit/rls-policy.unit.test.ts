import { describe, expect, it } from "vitest";
import { readFileSync } from "fs";
import path from "path";

describe("RLS tenant isolation policy", () => {
  it("defines tenant isolation policy in migration", () => {
    const sql = readFileSync(
      path.resolve("supabase/migrations/20260309000000_phase1_tenants_admin_rls.sql"),
      "utf8"
    );
    expect(sql).toContain("tenant_isolation");
    expect(sql).toContain("public.get_current_tenant_id()");
  });

  it("documents customer row scope so tenant A cannot read tenant B", () => {
    const sql = readFileSync(
      path.resolve("supabase/migrations/20260311000000_phase3_tenant_rls_session.sql"),
      "utf8"
    );
    expect(sql).toContain("customer_row_scope");
    expect(sql).toContain("tenant_id = public.get_current_tenant_id()");
  });
});
