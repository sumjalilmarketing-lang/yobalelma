import { expect, test } from "@playwright/test";
import { resetHub, signInHub } from "./hub-test-utils";

test("agent records a Hub inspection", async ({ page }) => {
  await signInHub(page);
  await resetHub(page);
  await page.goto("/hub/inspection/shp-001");
  await page.getByLabel("Poids reel").fill("4.4");
  await page.getByLabel("Decision").selectOption("approved");
  await page.getByRole("button", { name: "Enregistrer" }).click();

  await expect(page.getByText("Inspection colis")).toBeVisible();
});
