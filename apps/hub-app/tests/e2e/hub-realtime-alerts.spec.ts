import { expect, test } from "@playwright/test";
import { signInHub } from "./hub-test-utils";
test("realtime alert center displays severity and status", async ({ page }) => { await signInHub(page); await page.goto("/hub/alerts"); await expect(page.getByTestId("realtime-alerts")).toContainText("Stock dormant"); });
