import { expect, test } from "@playwright/test";
import { resetHub, signInHub } from "./hub-test-utils";

test("agent moves an inventory item", async ({ page }) => {
  await signInHub(page);
  await resetHub(page);
  await page.goto("/hub/inventory/shp-002");
  await page.getByLabel("Nouvel emplacement").selectOption("loc-storage-01");
  await page.getByLabel("Note").fill("Controle E2E mouvement");
  await page.getByRole("button", { name: "Deplacer" }).click();

  await expect(page.getByText("Fiche inventaire")).toBeVisible();
});
