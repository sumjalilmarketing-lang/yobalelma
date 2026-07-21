import { describe, expect, it } from "vitest";
import { readFile } from "node:fs/promises";
import path from "node:path";

describe("Hub middleware security", () => {
  it("resolves the authenticated role instead of trusting a cookie name", async () => {
    const source = await readFile(path.resolve(process.cwd(), "apps/hub-app/middleware.ts"), "utf8");

    expect(source).toContain("resolveSupabaseAccess");
    expect(source).toContain("supabase.auth.getUser()");
    expect(source).not.toContain("hasSupabaseAuthCookie");
  });
});
