import { expect, test } from "@playwright/test";
import {
  dateFromToday,
  ensureE2EUser,
  loginAs,
  requireSupabaseAuthenticatedE2E,
} from "../../../../tests/e2e/authenticated-helpers";

test.describe.serial("user-app international shipment", () => {
  test.beforeEach(() => {
    requireSupabaseAuthenticatedE2E();
  });

  test("detects an international shipment before creation", async ({ page }) => {
    const user = await ensureE2EUser("client", "user-app-international");

    await loginAs(page, user, "/client/shipments/new");
    await page.waitForURL((url) => url.pathname === "/client/shipments/new");

    await page.getByLabel("Nom expediteur").fill("Client International");
    await page.getByLabel("Telephone expediteur").fill("+33133333333");
    await page.getByLabel("Email expediteur").fill(user.email);
    await page.getByLabel("Pays de depart").fill("France");
    await page.getByLabel("Ville de depart").fill("Paris");
    await page.getByLabel("Code postal depart").fill("75002");
    await page.getByLabel("Adresse de depart").fill("3 rue du Test");
    await page.getByLabel("Nom destinataire").fill("Destinataire Dakar");
    await page.getByLabel("Telephone destinataire").fill("+221770000000");
    await page.getByLabel("Email destinataire").fill("dest.inter@yobalelma.test");
    await page.getByLabel("Pays d'arrivee").fill("Senegal");
    await page.getByLabel("Ville d'arrivee").fill("Dakar");
    await page.getByLabel("Adresse d'arrivee").fill("Plateau test");
    await page.getByLabel("Nom du colis").fill("Colis international E2E");
    await page.getByLabel("Date d'enlevement souhaitee").fill(dateFromToday(5));
    await page.getByLabel("Date limite de livraison").fill(dateFromToday(18));
    await page.getByLabel("Description du colis").fill("Colis international de test.");
    await page.locator('input[name="prohibitedItemsConfirmed"]').check();
    await page.locator('input[name="confirmationAccepted"]').check();

    await expect(page.getByText("Envoi international detecte automatiquement").first()).toBeVisible();
    await page.getByRole("button", { name: "Verifier l'expedition" }).click();
    await expect(page.getByText("International", { exact: true }).first()).toBeVisible();
    await expect(page.getByText("QR retrait")).toBeVisible();

    await page.getByRole("button", { name: "Confirmer et creer l'expedition" }).click();
    await expect(page.getByText("Expedition creee et confirmee.")).toBeVisible({
      timeout: 30_000,
    });
    await expect(page.getByText("Code de suivi : YBL-")).toBeVisible();
  });
});
