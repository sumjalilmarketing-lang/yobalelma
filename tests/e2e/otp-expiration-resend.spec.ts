import { expect, test } from "playwright/test";

test.describe("OTP expiration and resend", () => {
  test("OTP panel communicates server-side expiry and resend", async ({ page }) => {
    await page.goto("/recipient/delivery");

    await expect(page.getByRole("heading", { name: "Generer / renvoyer un OTP" })).toBeVisible();
    await expect(page.getByLabel("Duree de vie minutes")).toHaveValue("15");
    await expect(page.getByText("limite dans le temps")).toBeVisible();
  });
});
