import { expect, test } from "@playwright/test";
import { prepareParisShipment, resetHub, signInHub } from "./hub-test-utils";

test("manager reserves compatible capacity in an existing batch", async ({ page }) => {
  await signInHub(page, "hub_manager");
  await resetHub(page);
  await prepareParisShipment(page);
  await page.goto("/hub/batches/batch-cdg-001");
  await page.getByLabel("Colis compatible").selectOption("shp-006");
  await page.getByRole("button", { name: "Reserver" }).click();

  await expect(page.getByText("YBL-DSS-CDG-006")).toBeVisible();
});
