import { expect, test } from "@playwright/test";
import { generatePickupQr, resetHub, signInHub } from "./hub-test-utils";

test("agent confirms handover with identity, document and ticket checks", async ({ page }) => {
  await signInHub(page, "hub_manager");
  await resetHub(page);
  await generatePickupQr(page);
  await page.goto("/hub/handover/batch-cdg-001");
  await page.getByLabel("Identite verifiee").check();
  await page.getByLabel("KYC/document verifie").check();
  await page.getByLabel("Billet et vol verifies").check();
  await page.getByRole("button", { name: "Confirmer remise" }).click();

  await expect(page.getByText("Remise voyageur")).toBeVisible();
});
