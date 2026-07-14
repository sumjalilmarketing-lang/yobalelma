import { expect, test } from "@playwright/test";
import { expectPublicPage } from "./user-app-test-utils";

test.describe("user-app public tracking", () => {
  test("searches with a public tracking code without exposing private fields", async ({ page }) => {
    await expectPublicPage(page, "/tracking", "Suivre un colis");

    await page.getByLabel("Code de suivi Yobalelma").fill("BAD-CODE");
    await page.getByRole("button", { name: "Suivre" }).click();
    await expect(page).toHaveURL(/\/tracking|\/suivi/);
    await expect(page.getByText("Code invalide")).toBeVisible();

    await expect(page.getByText(/OTP|telephone prive|billet|KYC/i)).toHaveCount(0);
  });
});
