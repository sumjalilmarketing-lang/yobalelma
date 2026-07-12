import { expect, test } from "@playwright/test";

const publicRoutes = [
  "/",
  "/how-it-works",
  "/security",
  "/pricing",
  "/tracking",
  "/relay-points",
  "/prohibited-items",
  "/support",
  "/terms",
  "/privacy",
  "/auth/login",
  "/auth/register"
];

const protectedRoutes = ["/client", "/client/shipments", "/transporter", "/traveler"];

test.describe("user-app routes", () => {
  for (const route of publicRoutes) {
    test(`${route} renders publicly`, async ({ page }) => {
      const response = await page.goto(route);
      expect(response?.status()).toBeLessThan(400);
    });
  }

  for (const route of protectedRoutes) {
    test(`${route} is protected`, async ({ page }) => {
      await page.goto(route);
      await expect(page).toHaveURL(new RegExp("/auth/login"));
    });
  }
});
