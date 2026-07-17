import { expect, test } from "@playwright/test";
import { signInHub } from "./hub-test-utils";
test("manager sees dependency health and deployed version", async ({ page }) => { await signInHub(page, "hub_manager"); await page.goto("/hub/system-health"); await expect(page.getByTestId("system-health")).toContainText("enterprise-1.0.0"); });
