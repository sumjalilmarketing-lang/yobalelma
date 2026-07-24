import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const source = (path: string) => readFileSync(resolve(process.cwd(), path), "utf8");

describe("KYC security controls", () => {
  it("submits the verification through one atomic database operation", () => {
    const route = source("app/api/kyc/route.ts");

    expect(route).toContain('"submit_identity_verification"');
    expect(route).not.toContain('.from("identity_verifications").insert');
    expect(route).not.toContain('.from("identity_verification_documents").insert');
  });

  it("registers uploads before returning their signed URL", () => {
    const route = source("app/api/storage/signed-upload/route.ts");

    expect(route).toContain('"register_secure_upload"');
    expect(route).toContain('path.includes("..")');
    expect(route.indexOf('"register_secure_upload"')).toBeLessThan(route.lastIndexOf("return ok("));
  });

  it("requires clean, existing and size-matched objects before KYC submission", () => {
    const migration = source("supabase/migrations/20260722013000_secure_uploads_atomic_kyc.sql");

    expect(migration).toContain("u.security_status = 'clean'");
    expect(migration).toContain("join storage.objects o");
    expect(migration).toContain("u.consumed_at is null");
    expect(migration).toContain("o.metadata->>'size'");
    expect(migration).toContain("update public.profiles set identity_status");
  });

  it("keeps KYC decisions server-authorized and reasoned", () => {
    const migration = source("supabase/migrations/20260722013000_secure_uploads_atomic_kyc.sql");
    const route = source("apps/admin-app/app/api/admin/kyc/decisions/route.ts");

    expect(migration).toContain("KYC review permission required");
    expect(migration).toContain("length(trim(coalesce(p_comment, ''))) < 8");
    expect(route).toContain('"review_identity_verification"');
  });
});
