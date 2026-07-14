import { expect, test } from "playwright/test";
import { ensureE2EUser, loginAs, requireSupabaseAuthenticatedE2E } from "./authenticated-helpers";

test.describe("admin manual delivery override", () => {
  requireSupabaseAuthenticatedE2E();

  test("admin can access audited override controls", async ({ page }) => {
    const admin = await ensureE2EUser("admin", "manual-override");

    await loginAs(page, admin, "/dashboard/admin/delivery-overrides");
    await page.goto("/dashboard/admin/delivery-overrides");
    await expect(page.getByRole("heading", { name: "Overrides livraison" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Override admin audite" })).toBeVisible();
    await expect(page.getByText("Marquer livre avec preuve alternative")).toBeVisible();
  });
});
