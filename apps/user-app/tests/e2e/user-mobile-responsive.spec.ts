import { expect, test } from "@playwright/test";

test.describe("user-app mobile responsive", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test("renders home and tracking on mobile without horizontal overflow", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByText("Chaque voyage devient une livraison").first()).toBeVisible();

    const homeOverflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1);
    expect(homeOverflow).toBe(false);

    await page.goto("/tracking");
    await expect(page.getByLabel("Code de suivi Yobalelma")).toBeVisible();

    const trackingOverflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1);
    expect(trackingOverflow).toBe(false);
  });
});
