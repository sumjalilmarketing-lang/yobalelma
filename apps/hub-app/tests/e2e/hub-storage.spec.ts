import { expect, test } from "@playwright/test";
import { resetHub, signInHub } from "./hub-test-utils";

test("agent opens the storage map and locations", async ({ page }) => {
  await signInHub(page);
  await resetHub(page);
  await page.goto("/hub/storage");
  await expect(page.getByText("Stockage Hub")).toBeVisible();
  await page.getByRole("link", { name: /Voir les emplacements/ }).click();
  await expect(page.getByText("Emplacements")).toBeVisible();
});
