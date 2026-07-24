import { expect, test } from "@playwright/test";
import { resetHub, signInHub } from "./hub-test-utils";

test("Hub dashboard remains usable on mobile", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await signInHub(page);
  await resetHub(page);
  await expect(page.getByText("Centre operationnel Hub")).toBeVisible();
  await page.goto("/hub/scanner");
  await expect(page.getByRole("button", { name: "Scanner" })).toBeVisible();
});
