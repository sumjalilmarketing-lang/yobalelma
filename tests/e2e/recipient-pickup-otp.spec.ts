import { expect, test } from "playwright/test";

test.describe("recipient relay pickup OTP", () => {
  test("recipient delivery screen exposes pickup choice and OTP actions", async ({ page }) => {
    await page.goto("/recipient/delivery");

    await expect(page.getByRole("heading", { name: "Remise de colis" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Choisir le mode de remise" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Generer / renvoyer un OTP" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Verifier l'OTP et remettre" })).toBeVisible();
  });
});
