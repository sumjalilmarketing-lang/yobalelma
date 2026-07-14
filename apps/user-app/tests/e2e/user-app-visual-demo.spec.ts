import { mkdirSync } from "node:fs";
import path from "node:path";
import { expect, test, type Page } from "@playwright/test";
import {
  ensureE2EUser,
  loginAs,
  requireSupabaseAuthenticatedE2E,
  type E2EUser,
} from "../../../../tests/e2e/authenticated-helpers";

const screenshotsDir = path.resolve(
  process.cwd(),
  process.cwd().endsWith("user-app")
    ? "../../docs/visual-demo/user-app"
    : "docs/visual-demo/user-app",
);

test.describe.serial("user-app visual demonstration", () => {
  test.beforeEach(() => {
    requireSupabaseAuthenticatedE2E();
    mkdirSync(screenshotsDir, { recursive: true });
  });

  test("captures the important user-app screens", async ({ page }) => {
    test.setTimeout(240_000);

    await capturePublic(page, "/", "01-home.png", "Chaque voyage devient une livraison");
    await capturePublic(page, "/auth/login", "02-login.png", "Connexion securisee");
    await capturePublic(page, "/auth/register", "03-register.png", "Creer ton compte Yobalelma");
    await capturePublic(page, "/tracking", "08-tracking.png", "Suivre un colis");
    await capturePublic(page, "/recipient/delivery", "14-recipient-delivery.png", "Remise de colis");
    await capturePublic(page, "/support", "17-support.png", "Support");

    const client = await ensureE2EUser("client", "user-app-visual-client");
    await captureAuthenticated(page, client, "/client", "04-client-dashboard.png", "Espace client Yobalelma");
    await captureAuthenticated(page, client, "/client/shipments/new", "05-client-shipment-new.png", "Creer une expedition");
    await captureAuthenticated(page, client, "/client/shipments", "06-client-shipments.png", "Expeditions");
    await captureAuthenticated(page, client, "/client/notifications", "15-client-notifications.png", "Notifications");
    await captureAuthenticated(page, client, "/client/profile", "16-client-profile.png", "Profil");

    await page.context().clearCookies();
    const transporter = await ensureE2EUser("local_transporter", "user-app-visual-transporter");
    await captureAuthenticated(page, transporter, "/transporter", "09-transporter-dashboard.png", "Espace livreur local");
    await captureAuthenticated(page, transporter, "/transporter/missions/available", "10-transporter-missions.png", /Mission|missions/i);

    await page.context().clearCookies();
    const traveler = await ensureE2EUser("traveler", "user-app-visual-traveler");
    await captureAuthenticated(page, traveler, "/traveler", "11-traveler-dashboard.png", "Espace voyageur Yobalelma");
    await captureAuthenticated(page, traveler, "/traveler/trips/new", "12-traveler-trip-new.png", "Ajouter un voyage");
    await captureAuthenticated(page, traveler, "/traveler/capacity", "13-traveler-capacity.png", "Capacite");

    await page.setViewportSize({ width: 390, height: 844 });
    await capturePublic(page, "/", "18-mobile-home.png", "Chaque voyage devient une livraison");
  });
});

async function capturePublic(page: Page, route: string, filename: string, marker: string | RegExp) {
  const response = await page.goto(route);
  expect(response?.status(), route).toBeLessThan(400);
  await captureCurrent(page, filename, marker);
}

async function captureAuthenticated(
  page: Page,
  user: E2EUser,
  route: string,
  filename: string,
  marker: string | RegExp,
) {
  await loginAs(page, user, route);
  await page.waitForURL((url) => url.pathname === route, { timeout: 30_000 });
  await captureCurrent(page, filename, marker);
}

async function captureCurrent(page: Page, filename: string, marker: string | RegExp) {
  await expect(page.getByText(marker).first()).toBeVisible({ timeout: 20_000 });
  await page.screenshot({
    fullPage: true,
    path: path.join(screenshotsDir, filename),
  });
}
