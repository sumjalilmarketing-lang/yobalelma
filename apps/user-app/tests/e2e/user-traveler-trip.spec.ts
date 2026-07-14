import { expect, test } from "@playwright/test";
import {
  dateFromToday,
  ensureE2EUser,
  loginAs,
  requireSupabaseAuthenticatedE2E,
} from "../../../../tests/e2e/authenticated-helpers";

test.describe.serial("user-app traveler trip", () => {
  test.beforeEach(() => {
    requireSupabaseAuthenticatedE2E();
  });

  test("publishes a traveler trip with declared capacity", async ({ page }) => {
    const user = await ensureE2EUser("traveler", "user-app-traveler");

    await loginAs(page, user, "/traveler/trips/new");
    await page.waitForURL((url) => url.pathname === "/traveler/trips/new");

    await page.getByLabel("Ville de depart").fill("Paris");
    await page.getByLabel("Pays de depart").fill("France");
    await page.getByLabel("Ville d'arrivee").fill("Dakar");
    await page.getByLabel("Pays d'arrivee").fill("Senegal");
    await page.getByLabel("Date de depart").fill(dateFromToday(14));
    await page.getByLabel("Date d'arrivee").fill(dateFromToday(15));
    await page.getByLabel("Capacite disponible (kg)").fill("8");
    await page.getByLabel("Notes de voyage").fill("Capacite test E2E user-app.");

    await page.getByRole("button", { name: "Publier mon voyage" }).click();
    await expect(page.getByText("Voyage publie. Tu peux maintenant recevoir des propositions de colis.")).toBeVisible({
      timeout: 30_000,
    });
  });
});
