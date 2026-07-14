import { expect, test } from "@playwright/test";
import {
  ensureE2EUser,
  loginAs,
  requireSupabaseAuthenticatedE2E,
} from "../../../../tests/e2e/authenticated-helpers";

test.describe.serial("user-app transporter mission", () => {
  test.beforeEach(() => {
    requireSupabaseAuthenticatedE2E();
  });

  test("opens transporter workspace and operational mission routes", async ({ page }) => {
    const user = await ensureE2EUser("local_transporter", "user-app-transporter");

    await loginAs(page, user, "/transporter");
    await page.waitForURL((url) => url.pathname === "/transporter");
    await expect(page.getByRole("heading", { exact: true, name: "Espace livreur local" }).first()).toBeVisible();

    for (const route of ["/transporter/missions", "/transporter/missions/available", "/transporter/missions/active"]) {
      await page.goto(route);
      await expect(page.getByText(/Mission|missions|Controle operationnel/i).first()).toBeVisible();
    }
  });
});
