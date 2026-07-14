import { expect, test } from "playwright/test";
import {
  dateFromToday,
  ensureE2EUser,
  loginAs,
  requireSupabaseAuthenticatedE2E,
  type E2ERole,
} from "./authenticated-helpers";

const roleDashboards: Array<{
  expectedPath: string;
  marker: string;
  role: E2ERole;
}> = [
  { role: "client", expectedPath: "/dashboard/client", marker: "Espace client Yobalelma" },
  { role: "traveler", expectedPath: "/dashboard/traveler", marker: "Espace voyageur Yobalelma" },
  { role: "local_transporter", expectedPath: "/dashboard/transporter", marker: "Espace livreur local" },
  { role: "relay_agent", expectedPath: "/dashboard/relay", marker: "Relais et scans colis" },
  { role: "hub_agent", expectedPath: "/dashboard/hub", marker: "Hub, batches et capacite" },
  { role: "collection_driver", expectedPath: "/dashboard/collection", marker: "Collecte Yobalelma" },
  { role: "operations_manager", expectedPath: "/dashboard/operations", marker: "Pilotage operations" },
  { role: "support_agent", expectedPath: "/dashboard/support", marker: "Support et litiges" },
  { role: "admin", expectedPath: "/dashboard/admin", marker: "Back-office Yobalelma" },
];

test.describe.serial("authenticated role workflows", () => {
  test.beforeEach(() => {
    requireSupabaseAuthenticatedE2E();
  });

  for (const dashboard of roleDashboards) {
    test(`${dashboard.role} signs in and reaches the expected dashboard`, async ({ page }) => {
      const user = await ensureE2EUser(dashboard.role);

      await loginAs(page, user);

      await page.waitForURL((url) => url.pathname === dashboard.expectedPath);
      await expect(page.getByText(dashboard.marker)).toBeVisible();
    });
  }

  test("client creates a national shipment with Supabase session", async ({ page }) => {
    const user = await ensureE2EUser("client");
    const runId = Date.now().toString(36);

    await loginAs(page, user, "/dashboard/client/shipments/new");
    await page.waitForURL((url) => url.pathname === "/dashboard/client/shipments/new");

    await page.getByLabel("Nom expediteur").fill("Client Test Yobalelma");
    await page.getByLabel("Telephone expediteur").fill("+33111111111");
    await page.getByLabel("Email expediteur").fill(user.email);
    await page.getByLabel("Pays de depart").fill("France");
    await page.getByLabel("Ville de depart").fill("Paris");
    await page.getByLabel("Code postal depart").fill("75001");
    await page.getByLabel("Adresse de depart").fill("1 rue du Test");
    await page.getByLabel("Instructions depart").fill("Code porte E2E.");

    await page.getByLabel("Nom destinataire").fill("Destinataire Test");
    await page.getByLabel("Telephone destinataire").fill("+33122222222");
    await page.getByLabel("Email destinataire").fill(`dest.${runId}@yobalelma.test`);
    await page.getByLabel("Pays d'arrivee").fill("France");
    await page.getByLabel("Ville d'arrivee").fill("Lyon");
    await page.getByLabel("Code postal arrivee").fill("69001");
    await page.getByLabel("Adresse d'arrivee").fill("2 avenue du Test");
    await page.getByLabel("Instructions arrivee").fill("Livrer en main propre.");

    await page.getByLabel("Nom du colis").fill(`Documents E2E ${runId}`);
    await page.getByLabel("Poids (kg)").fill("1.2");
    await page.getByLabel("Valeur declaree (centimes)").fill("2500");
    await page.getByLabel("Longueur (cm)").fill("30");
    await page.getByLabel("Largeur (cm)").fill("20");
    await page.getByLabel("Hauteur (cm)").fill("10");
    await page.getByLabel("Date d'enlevement souhaitee").fill(dateFromToday(3));
    await page.getByLabel("Date limite de livraison").fill(dateFromToday(7));
    await page
      .getByLabel("Description du colis")
      .fill("Documents administratifs de test sans valeur reelle.");
    await page.locator('input[name="prohibitedItemsConfirmed"]').check();
    await page.locator('input[name="confirmationAccepted"]').check();

    await page.getByRole("button", { name: "Verifier l'expedition" }).click();
    await expect(page.getByText("Verification avant creation")).toBeVisible();
    await expect(page.getByText("National", { exact: true })).toBeVisible();

    await page.getByRole("button", { name: "Confirmer et creer l'expedition" }).click();
    await expect(page.getByText("Expedition creee et confirmee.")).toBeVisible({
      timeout: 30_000,
    });
    await expect(page.getByText("Code de suivi : YBL-")).toBeVisible();
  });

  test("traveler publishes a trip with available capacity", async ({ page }) => {
    const user = await ensureE2EUser("traveler");

    await loginAs(page, user, "/dashboard/traveler/trips/new");
    await page.waitForURL((url) => url.pathname === "/dashboard/traveler/trips/new");

    await page.getByLabel("Ville de depart").fill("Paris");
    await page.getByLabel("Pays de depart").fill("France");
    await page.getByLabel("Ville d'arrivee").fill("Dakar");
    await page.getByLabel("Pays d'arrivee").fill("Senegal");
    await page.getByLabel("Date de depart").fill(dateFromToday(14));
    await page.getByLabel("Date d'arrivee").fill(dateFromToday(15));
    await page.getByLabel("Capacite disponible (kg)").fill("8");
    await page
      .getByLabel("Notes de voyage")
      .fill("Capacite test E2E, aucun colis reel accepte.");

    await page.getByRole("button", { name: "Publier mon voyage" }).click();
    await expect(
      page.getByText("Voyage publie. Tu peux maintenant recevoir des propositions de colis."),
    ).toBeVisible();
  });

  test("client cannot access hub workspace", async ({ page }) => {
    const user = await ensureE2EUser("client");

    await loginAs(page, user);
    await page.waitForURL((url) => url.pathname === "/dashboard/client");

    await page.goto("/dashboard/hub");

    await page.waitForURL((url) => url.pathname === "/dashboard/client");
    await expect(page.getByText("Espace client Yobalelma")).toBeVisible();
  });
});
