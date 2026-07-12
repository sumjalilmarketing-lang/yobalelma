import { expect, test } from "playwright/test";

const protectedRoutes = [
  "/dashboard/client/tracking",
  "/dashboard/client/payments",
  "/dashboard/transporter/missions/available",
  "/dashboard/transporter/earnings",
  "/dashboard/relay/dropoff",
  "/dashboard/collection/stops",
  "/dashboard/traveler/tickets",
  "/dashboard/hub/storage",
  "/dashboard/hub/batches/new",
];

test.describe("role access control", () => {
  for (const route of protectedRoutes) {
    test(`${route} redirects anonymous users`, async ({ page }) => {
      await page.goto(route);

      await expect(page).toHaveURL(/\/auth\/sign-in/);
      await expect(page.getByRole("heading", { name: "Connexion securisee" })).toBeVisible();
    });
  }
});

