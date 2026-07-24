import { expect, test } from "@playwright/test";
import { signInHub } from "./hub-test-utils";
test("reporting renders operational analytics", async ({ page }) => { await signInHub(page, "hub_supervisor"); await page.goto("/hub/reports"); await expect(page.getByTestId("reporting")).toContainText("+12.4%"); });
