import { expect, test } from "playwright/test";
import { ensureE2EUser, loginAs, requireSupabaseAuthenticatedE2E } from "./authenticated-helpers";

test.describe("final mile delivery", () => {
  requireSupabaseAuthenticatedE2E();

  test("relay agent can access final mile mission creation", async ({ page }) => {
    const relay = await ensureE2EUser("relay_agent", "final-mile");

    await loginAs(page, relay, "/dashboard/relay/final-delivery");
    await expect(page.getByRole("heading", { name: "Livraison finale destination" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Creer une mission finale" })).toBeVisible();
    await expect(page.getByText("meilleur profil actif").first()).toBeVisible();
  });
});
