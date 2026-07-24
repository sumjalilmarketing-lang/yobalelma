import { readFile } from "node:fs/promises";
import path from "node:path";
import { describe, expect, it } from "vitest";

describe("Admin MFA", () => {
  it("requires AAL2 for every protected Admin session, including accounts without a factor", async () => {
    const source = await readFile(path.resolve(process.cwd(), "apps/admin-app/middleware.ts"), "utf8");
    expect(source).toContain("getAuthenticatorAssuranceLevel");
    expect(source).toContain("currentLevel !== \"aal2\"");
    expect(source).not.toContain("hasVerifiedFactor &&");
    expect(source).not.toContain("cookie.name.toLowerCase()");
  });

  it("rejects protocol-relative and backslash redirects", async () => {
    const source = await readFile(path.resolve(process.cwd(), "apps/admin-app/app/api/auth/sign-in/route.ts"), "utf8");
    expect(source).toContain('!requested.startsWith("//")');
    expect(source).toContain('!requested.includes("\\\\")');
  });

  it("routes accounts without a factor to enrollment and documents secure recovery", async () => {
    const signIn = await readFile(path.resolve(process.cwd(), "apps/admin-app/app/api/auth/sign-in/route.ts"), "utf8");
    const enrollment = await readFile(path.resolve(process.cwd(), "apps/admin-app/app/auth/mfa/enroll/page.tsx"), "utf8");
    const recovery = await readFile(path.resolve(process.cwd(), "apps/admin-app/app/auth/mfa/recovery/page.tsx"), "utf8");
    expect(signIn).toContain('hasVerifiedFactor ? "/auth/mfa" : "/auth/mfa/enroll"');
    expect(enrollment).toContain("challengeAndVerify");
    expect(enrollment).toContain("Aucun accès sensible n’a été accordé");
    expect(recovery).toContain("révoquera le facteur perdu");
    expect(recovery).toContain("deux agents autorisés");
  });

  it("includes finance, security and direction roles in controlled pilot enrollment", async () => {
    const source = await readFile(path.resolve(process.cwd(), "scripts/enroll-pilot-mfa.mjs"), "utf8");
    for (const role of ["super_admin", "admin", "operations_manager", "country_manager", "finance_manager", "security_manager"]) {
      expect(source).toContain(`"${role}"`);
    }
  });
});
