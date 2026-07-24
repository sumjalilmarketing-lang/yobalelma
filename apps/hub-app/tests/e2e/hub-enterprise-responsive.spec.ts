import { expect, test } from "@playwright/test";
import { signInHub } from "./hub-test-utils";
test("control tower remains usable on mobile tablet and desktop", async ({ page }) => { await signInHub(page, "hub_manager"); for (const viewport of [{ width: 390, height: 844 }, { width: 820, height: 1180 }, { width: 1440, height: 900 }]) { await page.setViewportSize(viewport); await page.goto("/hub/control-tower"); await expect(page.getByTestId("control-tower")).toBeVisible(); } });
