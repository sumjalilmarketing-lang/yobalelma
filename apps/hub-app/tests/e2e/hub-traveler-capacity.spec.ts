import { expect, test } from "@playwright/test";
import { resetHub, signInHub } from "./hub-test-utils";

test("agent views traveler capacities", async ({ page }) => {
  await signInHub(page);
  await resetHub(page);
  await page.goto("/hub/capacities");
  await expect(page.getByRole("heading", { level: 1, name: "Capacites voyageurs" })).toBeVisible();
  await expect(page.getByText("Air Senegal HC403")).toBeVisible();
});
