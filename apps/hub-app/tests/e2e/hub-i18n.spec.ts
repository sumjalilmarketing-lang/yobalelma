import { expect, test } from "@playwright/test";
import { resetHub, signInHub } from "./hub-test-utils";

test("Hub supports Arabic RTL selection", async ({ page }) => {
  await signInHub(page);
  await resetHub(page);
  await page.goto("/hub");
  await page.getByLabel("Langue").selectOption("ar");

  await expect.poll(() => page.evaluate(() => document.documentElement.dir)).toBe("rtl");
});
