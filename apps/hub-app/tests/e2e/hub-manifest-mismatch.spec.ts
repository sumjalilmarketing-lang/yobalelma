import { expect, test } from "@playwright/test";
import { resetHub, signInHub } from "./hub-test-utils";

test("manifest mismatch without justification is rejected", async ({ page }) => {
  await signInHub(page);
  await resetHub(page);
  await page.goto("/hub/scanner");
  await page.getByLabel("Tracking").fill("YBL-DSS-CDG-006");
  await page.getByLabel("Statut").selectOption("missing_at_hub");
  await page.getByRole("button", { name: "Scanner" }).click();

  await expect(page).toHaveURL(/error=/);
});
