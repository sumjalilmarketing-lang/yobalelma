import { readFile } from "node:fs/promises";
import path from "node:path";
import { describe, expect, it } from "vitest";

describe("Admin MFA", () => {
  it("requires AAL2 when a verified factor exists", async () => {
    const source = await readFile(path.resolve(process.cwd(), "apps/admin-app/middleware.ts"), "utf8");
    expect(source).toContain("getAuthenticatorAssuranceLevel");
    expect(source).toContain("currentLevel !== \"aal2\"");
    expect(source).not.toContain("cookie.name.toLowerCase()");
  });

  it("rejects protocol-relative and backslash redirects", async () => {
    const source = await readFile(path.resolve(process.cwd(), "apps/admin-app/app/api/auth/sign-in/route.ts"), "utf8");
    expect(source).toContain('!requested.startsWith("//")');
    expect(source).toContain('!requested.includes("\\\\")');
  });
});
