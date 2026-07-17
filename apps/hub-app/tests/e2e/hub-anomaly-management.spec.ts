import { expect, test } from "@playwright/test";
import { resetHub, signInHub } from "./hub-test-utils";

test("agent creates an operational anomaly", async ({ page }) => {
  await signInHub(page);
  await resetHub(page);
  await page.goto("/hub/anomalies");
  await page.getByLabel("Titre").fill("Anomalie E2E");
  await page.getByLabel("Description").fill("Controle automatique Playwright");
  await page.getByRole("button", { name: "Creer" }).click();

  await expect(page.getByText("Anomalie E2E")).toBeVisible();
});
