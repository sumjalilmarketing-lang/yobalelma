import { expect, test } from "@playwright/test";
import { resetHub, signInHub } from "./hub-test-utils";

test("agent receives and confirms an inbound manifest", async ({ page }) => {
  await signInHub(page);
  await resetHub(page);
  await page.goto("/hub/inbound/manifest-dss-002");
  await expect(page.getByText("Manifeste manifest-dss-002")).toBeVisible();

  await page.getByRole("button", { name: "Enregistrer" }).click();
  await expect(page.getByText("received_at_hub")).toBeVisible();
  await page.getByRole("button", { name: "Confirmer" }).click();
  await expect(page.getByText("Manifeste manifest-dss-002")).toBeVisible();
});
