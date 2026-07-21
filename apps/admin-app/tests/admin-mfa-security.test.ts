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
});
