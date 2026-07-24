import { expect, test } from "@playwright/test";
import { generatePickupQr, resetHub, signInHub } from "./hub-test-utils";

test("manager generates a secure pickup QR token", async ({ page }) => {
  await signInHub(page, "hub_manager");
  await resetHub(page);
  await generatePickupQr(page);
  await page.goto("/hub/batches/batch-cdg-001");

  await expect(page.getByText("QR de retrait")).toBeVisible();
  await expect(page.getByText(/ybq_/)).toBeVisible();
});
