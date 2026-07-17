import path from "node:path";
import { expect, test, type Page } from "@playwright/test";

const password = process.env.HUB_PILOT_PASSWORD;
const manifestId = process.env.HUB_PILOT_MANIFEST_ID ?? "0118b592-60e4-4317-8d8d-863f77538b15";
const shipmentIds = (process.env.HUB_PILOT_SHIPMENT_IDS ?? "eaf31038-1afd-49c9-8b49-bd776b264515,bf30ebff-f974-4531-8843-d03560aa5b8c").split(",");
const tripId = process.env.HUB_PILOT_TRIP_ID ?? "ba72b8fa-7630-43d4-b105-4f0c829c1ceb";
const storageLocationId = process.env.HUB_PILOT_STORAGE_LOCATION_ID ?? "b06683bb-811a-4957-bfaf-fd1fd6ac6b9a";
const gallery = path.resolve(process.cwd(), "../../docs/visual-demo/hub-app-staging");

if (!password) throw new Error("HUB_PILOT_PASSWORD is required for staging tests.");

async function signIn(page: Page, email: string) {
  await page.goto("/auth/sign-in");
  await page.getByLabel("Email professionnel").fill(email);
  await page.getByLabel("Mot de passe").fill(password!);
  await page.getByRole("button", { name: "Entrer avec Supabase" }).click();
}

async function capture(page: Page, fileName: string) {
  await expect(page.locator("main")).toBeVisible();
  await page.screenshot({ fullPage: true, path: path.join(gallery, fileName) });
}

async function gotoWithRetry(page: Page, route: string) {
  let lastError: unknown;
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      await page.goto(route);
      return;
    } catch (error) {
      lastError = error;
      await page.waitForTimeout(1_000 * (attempt + 1));
    }
  }
  throw lastError;
}

test("real staging auth enforces Hub roles and persists the session", async ({ page }) => {
  await page.goto("/auth/sign-in");
  await capture(page, "01-connexion-hub.png");
  await expect(page.getByText("Mode demonstration")).toHaveCount(0);

  await signIn(page, "pilot.hub-agent@yobalelma.test");
  await expect(page).toHaveURL(/\/hub$/);
  await expect(page.getByText("Centre operationnel Hub")).toBeVisible();
  await page.reload();
  await expect(page.getByText("Centre operationnel Hub")).toBeVisible();

  await page.getByRole("button", { name: "Deconnexion" }).click();
  await expect(page).toHaveURL(/\/auth\/sign-in/);

  await signIn(page, "pilot.hub-denied@yobalelma.test");
  await gotoWithRetry(page, "/hub");
  await expect(page).toHaveURL(/\/auth\/sign-in/);
});

test("real staging pilot completes inbound to traveler handover and captures evidence", async ({ page }) => {
  await signIn(page, "pilot.operations-manager@yobalelma.test");
  await expect(page).toHaveURL(/\/hub$/);
  await capture(page, "02-dashboard.png");

  await page.goto(`/hub/inbound/${manifestId}`);
  await expect(page.getByText(`Manifeste ${manifestId}`)).toBeVisible();
  await capture(page, "03-reception-manifeste.png");

  await page.goto("/hub/scanner");
  await capture(page, "04-scanner.png");
  await page.locator('select[name="manifestId"]').selectOption(manifestId);
  await page.locator('input[name="trackingCode"]').fill("YBL-PILOT001");
  await page.locator('select[name="status"]').selectOption("received_at_hub");
  await page.getByRole("button", { name: "Scanner" }).click();
  await page.locator('input[name="trackingCode"]').fill("YBL-PILOT002");
  await page.locator('select[name="status"]').selectOption("damaged_at_hub");
  await page.locator('input[name="note"]').fill("Emballage marque pendant la collecte pilote");
  await page.getByRole("button", { name: "Scanner" }).click();

  await page.goto(`/hub/inbound/${manifestId}`);
  await expect(page.getByText("received_at_hub")).toBeVisible();
  await expect(page.getByText("damaged_at_hub")).toBeVisible();
  await page.getByRole("button", { name: "Confirmer" }).click();

  await page.goto(`/hub/inspection/${shipmentIds[0]}`);
  await capture(page, "05-inspection.png");
  await page.locator('input[name="measuredWeightKg"]').fill("4.2");
  await page.locator('select[name="packagingQuality"]').selectOption("excellent");
  await page.locator('select[name="decision"]').selectOption("approved");
  await page.locator('input[name="note"]').fill("Inspection pilote conforme");
  await page.getByRole("button", { name: "Enregistrer" }).click();

  await page.goto("/hub/inventory");
  await expect(page.getByText("YBL-PILOT001")).toBeVisible();
  await capture(page, "06-inventaire.png");
  await page.goto(`/hub/inventory/${shipmentIds[0]}`);
  await page.locator('select[name="toLocationId"]').selectOption(storageLocationId);
  await page.locator('select[name="status"]').selectOption("in_storage");
  await page.locator('input[name="note"]').fill("Rangement pilote valide");
  await page.getByRole("button", { name: "Deplacer" }).click();

  await page.goto("/hub/storage");
  await capture(page, "07-stockage.png");
  await page.goto("/hub/trips");
  await capture(page, "08-voyages.png");
  await page.goto("/hub/capacities");
  await capture(page, "09-capacites.png");

  await page.goto("/hub/batches/new");
  await capture(page, "10-creation-lot.png");
  await page.locator('select[name="tripId"]').selectOption(tripId);
  await page.locator('input[name="shipmentIds"]').fill(shipmentIds[0]);
  await page.getByRole("button", { name: "Creer" }).click();
  await expect(page).toHaveURL(/\/hub\/batches\/[0-9a-f-]+$/);
  const batchId = new URL(page.url()).pathname.split("/").at(-1)!;
  await page.getByRole("button", { name: "Generer QR" }).click();
  await expect(page.getByText("QR de retrait")).toBeVisible();
  await capture(page, "11-qr-retrait.png");

  await page.goto(`/hub/handover/${batchId}`);
  await expect(page.locator('input[name="token"]')).not.toHaveValue("");
  await capture(page, "12-remise-voyageur.png");
  await page.locator('input[name="verifiedIdentity"]').check();
  await page.locator('input[name="verifiedDocument"]').check();
  await page.locator('input[name="verifiedTicket"]').check();
  await page.locator('input[name="note"]').fill("Remise pilote validee");
  await page.getByRole("button", { name: "Confirmer remise" }).click();

  await page.goto("/hub/anomalies");
  await capture(page, "13-anomalies.png");
  await page.goto("/hub/notifications");
  await capture(page, "14-notifications.png");
  await page.goto("/hub/profile");
  await capture(page, "15-profil.png");

  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/hub");
  await capture(page, "16-mobile.png");
  await page.setViewportSize({ width: 820, height: 1180 });
  await page.goto("/hub/inventory");
  await capture(page, "17-tablette.png");
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/hub");
  await capture(page, "18-desktop.png");
});
