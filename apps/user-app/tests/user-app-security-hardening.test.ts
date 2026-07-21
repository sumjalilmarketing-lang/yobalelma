import { readFile } from "node:fs/promises";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { fail } from "@/lib/api/responses";
import { DEFAULT_USER_ERROR } from "@/lib/presentation/user-facing-copy";
import { toBusinessStatusLabel } from "@/lib/presentation/business-labels";

describe("user-app security hardening", () => {
  it("removes implementation details from every failed API response", async () => {
    const response = fail('relation "traveler_documents" does not exist', 400);
    await expect(response.json()).resolves.toMatchObject({
      message: DEFAULT_USER_ERROR,
      ok: false,
    });
  });

  it("does not expose internal workflow status values", () => {
    expect(toBusinessStatusLabel("requires_confirmation")).toBe("Confirmation requise");
    expect(toBusinessStatusLabel("unknown_internal_state")).toBe("Mise à jour disponible");
  });

  it("fails closed when identity configuration is unavailable", async () => {
    const source = await readFile(
      path.resolve(process.cwd(), "apps/user-app/middleware.ts"),
      "utf8",
    );
    expect(source).toContain("status: 503");
    expect(source).not.toContain("if (!supabaseUrl || !supabaseKey) {\n    return NextResponse.next()");
  });

  it("does not render the removed synthetic ticket extractor", async () => {
    const source = await readFile(
      path.resolve(process.cwd(), "app/dashboard/traveler/trips/[id]/page.tsx"),
      "utf8",
    );
    expect(source).not.toContain("FlightTicketExtractor");
    expect(source).not.toContain("sandbox");
  });

  it("does not allow profile updates to change account roles", async () => {
    const source = await readFile(
      path.resolve(process.cwd(), "app/api/profile/route.ts"),
      "utf8",
    );
    expect(source).not.toContain("primary_role:");
    expect(source).not.toContain("role: parsed.data");
  });

  it("never creates simulated payments in production", async () => {
    const source = await readFile(
      path.resolve(process.cwd(), "app/api/payments/intents/route.ts"),
      "utf8",
    );
    expect(source).toContain('process.env.NODE_ENV === "production"');
    expect(source).toContain("Aucune somme n’a été débitée");
  });
});
