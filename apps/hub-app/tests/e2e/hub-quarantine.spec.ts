import { expect, test } from "@playwright/test";
import { resetHub, signInHub } from "./hub-test-utils";

test("agent can quarantine a risky shipment", async ({ page }) => {
  await signInHub(page);
  await resetHub(page);
  await page.goto("/hub/inspection/shp-004");
  await page.getByLabel("Decision").selectOption("quarantined");
  await page.getByLabel("Note agent").fill("Photo et controle superviseur requis");
  await page.getByRole("button", { name: "Enregistrer" }).click();

  await page.goto("/hub/anomalies");
  await expect(page.getByText("Inspection YBL-DSS-ABJ-004")).toBeVisible();
});
