import { expect, test } from "@playwright/test";
import { signInHub } from "./hub-test-utils";
test("enterprise pages support English and Arabic RTL", async ({ page }) => { await signInHub(page, "hub_manager"); await page.goto("/hub/control-tower"); await page.getByLabel("Langue").selectOption("en"); await expect(page.getByText("Hub comparison")).toBeVisible(); await page.getByLabel("Langue").selectOption("ar"); await expect(page.locator("html")).toHaveAttribute("dir", "rtl"); });
