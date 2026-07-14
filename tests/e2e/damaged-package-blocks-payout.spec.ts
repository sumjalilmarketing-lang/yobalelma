import { expect, test } from "playwright/test";
import { ensureE2EUser, loginAs, requireSupabaseAuthenticatedE2E } from "./authenticated-helpers";

test.describe("damaged package blocks payout", () => {
  requireSupabaseAuthenticatedE2E();

  test("admin payout review exposes blocked payout evidence", async ({ page }) => {
    const admin = await ensureE2EUser("admin", "payout-block");

    await loginAs(page, admin, "/dashboard/admin/payout-review");
    await expect(page.getByRole("heading", { name: "Revue payout", level: 1 })).toBeVisible();
    await expect(page.getByText("provider sandbox/manual")).toBeVisible();
  });
});
