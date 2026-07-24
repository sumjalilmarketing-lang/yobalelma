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

  test("keeps the authentication copy readable on mobile", async ({ page }) => {
    await page.goto("/auth/login");

    await expect(page.getByRole("heading", { name: "Connexion sécurisée" })).toBeVisible();
    await expect(page.getByText("Tes informations restent confidentielles.")).toBeVisible();
    await expect(page.getByRole("button", { name: "Se connecter" })).toBeVisible();

    const metrics = await page.evaluate(() => ({
      contentWidth: document.documentElement.scrollWidth,
      viewportWidth: document.documentElement.clientWidth,
    }));

    expect(metrics.contentWidth).toBeLessThanOrEqual(metrics.viewportWidth + 1);
  });
});
