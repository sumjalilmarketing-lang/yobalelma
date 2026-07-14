import { expect, test } from "@playwright/test";
import { expectPublicPage } from "./user-app-test-utils";

test.describe("user-app recipient delivery", () => {
  test("renders recipient delivery choice and OTP surfaces", async ({ page }) => {
    await expectPublicPage(page, "/recipient/delivery", "Remise de colis");
    await expect(page.getByText("Choix retrait ou livraison finale")).toBeVisible();
    await expect(page.getByRole("button", { name: /Choisir|Generer/i }).first()).toBeVisible();
  });
});
