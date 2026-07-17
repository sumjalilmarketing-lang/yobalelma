import { expect, test } from "@playwright/test";
import { prepareParisShipment, resetHub, signInHub } from "./hub-test-utils";

test("manager creates a Hub batch", async ({ page }) => {
  await signInHub(page, "hub_manager");
  await resetHub(page);
  await prepareParisShipment(page);
  await page.goto("/hub/batches/new");
  await page.getByLabel("Colis optionnels").fill("shp-006");
  await page.getByRole("button", { name: "Creer" }).click();

  await expect(page).toHaveURL(/\/hub\/batches\/batch-/);
  await expect(page.getByText("Lot Hub")).toBeVisible();
});
