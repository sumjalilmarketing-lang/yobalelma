import { readFile } from "node:fs/promises";
import path from "node:path";
import { describe, expect, it } from "vitest";

describe.each(["relay-app", "collection-app"])("%s middleware security", (application) => {
  it("validates the authenticated user and assigned role", async () => {
    const source = await readFile(path.resolve(process.cwd(), `apps/${application}/middleware.ts`), "utf8");
    expect(source).toContain("resolveSupabaseAccess");
    expect(source).toContain("supabase.auth.getUser()");
    expect(source).not.toContain("hasSupabaseCookie");
  });
});
