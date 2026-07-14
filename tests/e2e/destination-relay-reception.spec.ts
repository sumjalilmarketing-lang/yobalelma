import { expect, test } from "playwright/test";
import { ensureE2EUser, loginAs, requireSupabaseAuthenticatedE2E } from "./authenticated-helpers";

test.describe("destination relay reception", () => {
  requireSupabaseAuthenticatedE2E();

  test("relay agent can open destination reception and final inventory controls", async ({ page }) => {
    const relay = await ensureE2EUser("relay_agent", "final-destination");

    await loginAs(page, relay, "/dashboard/relay/destination-reception");
    await expect(page.getByRole("heading", { name: "Reception destination" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Scan QR destination" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Receptionner un lot destination" })).toBeVisible();
  });
});
