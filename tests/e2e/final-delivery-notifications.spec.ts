import { expect, test } from "playwright/test";
import { ensureE2EUser, loginAs, requireSupabaseAuthenticatedE2E } from "./authenticated-helpers";

test.describe("final delivery notifications", () => {
  requireSupabaseAuthenticatedE2E();

  test("client can open notification inbox for delivery transitions", async ({ page }) => {
    const client = await ensureE2EUser("client", "final-notifications");

    await loginAs(page, client, "/dashboard/client/notifications");
    await expect(page.getByRole("heading", { name: "Notifications" })).toBeVisible();
    await expect(page.getByText("Alertes in-app")).toBeVisible();
  });
});
