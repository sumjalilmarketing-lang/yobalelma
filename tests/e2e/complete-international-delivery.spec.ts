import { expect, test } from "playwright/test";
import { ensureE2EUser, loginAs, requireSupabaseAuthenticatedE2E } from "./authenticated-helpers";

test.describe("complete international final delivery screens", () => {
  requireSupabaseAuthenticatedE2E();

  test("operations can navigate relay, recipient and admin final delivery surfaces", async ({ page }) => {
    const operations = await ensureE2EUser("operations_manager", "complete-final");

    await loginAs(page, operations, "/dashboard/relay/final-delivery");
    await expect(page.getByRole("heading", { name: "Livraison finale destination" })).toBeVisible();

    await page.goto("/recipient/delivery");
    await expect(page.getByRole("heading", { name: "Remise de colis" })).toBeVisible();

    await loginAs(page, operations, "/dashboard/admin/audit-logs");
    await expect(page.getByRole("heading", { name: "Audit logs livraison finale" })).toBeVisible();
  });
});
