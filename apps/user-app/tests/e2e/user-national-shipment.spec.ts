import { expect, test } from "@playwright/test";
import {
  dateFromToday,
  ensureE2EUser,
  loginAs,
  requireSupabaseAuthenticatedE2E,
} from "../../../../tests/e2e/authenticated-helpers";

test.describe.serial("user-app national shipment", () => {
  test.beforeEach(() => {
    requireSupabaseAuthenticatedE2E();
  });

  test("creates a national shipment from the independent app", async ({ page }) => {
    const user = await ensureE2EUser("client", "user-app-national");
    const runId = Date.now().toString(36);

    await loginAs(page, user, "/client/shipments/new");
    await page.waitForURL((url) => url.pathname === "/client/shipments/new");

    await page.getByLabel("Nom expediteur").fill("Client Test Yobalelma");
    await page.getByLabel("Telephone expediteur").fill("+33111111111");
    await page.getByLabel("Email expediteur").fill(user.email);
    await page.getByLabel("Pays de depart").fill("France");
    await page.getByLabel("Ville de depart").fill("Paris");
    await page.getByLabel("Code postal depart").fill("75001");
    await page.getByLabel("Adresse de depart").fill("1 rue du Test");
    await page.getByLabel("Nom destinataire").fill("Destinataire Test");
    await page.getByLabel("Telephone destinataire").fill("+33122222222");
    await page.getByLabel("Email destinataire").fill(`dest.${runId}@yobalelma.test`);
    await page.getByLabel("Pays d'arrivee").fill("France");
    await page.getByLabel("Ville d'arrivee").fill("Lyon");
    await page.getByLabel("Code postal arrivee").fill("69001");
    await page.getByLabel("Adresse d'arrivee").fill("2 avenue du Test");
    await page.getByLabel("Nom du colis").fill(`Documents E2E ${runId}`);
    await page.getByLabel("Date d'enlevement souhaitee").fill(dateFromToday(3));
    await page.getByLabel("Date limite de livraison").fill(dateFromToday(7));
    await page.getByLabel("Description du colis").fill("Documents de test sans valeur reelle.");
    await page.locator('input[name="prohibitedItemsConfirmed"]').check();
    await page.locator('input[name="confirmationAccepted"]').check();

    await page.getByRole("button", { name: "Verifier l'expedition" }).click();
    await expect(page.getByText("Verification avant creation")).toBeVisible();
    await expect(page.getByText("National", { exact: true })).toBeVisible();
  });
});
