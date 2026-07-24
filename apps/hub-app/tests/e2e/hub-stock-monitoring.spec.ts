import { expect, test } from "@playwright/test";
import { signInHub } from "./hub-test-utils";
test("stock monitoring shows dormant and reconciliation signals", async ({ page }) => { await signInHub(page, "hub_supervisor"); await page.goto("/hub/stock-monitoring"); await expect(page.getByTestId("stock-monitoring")).toContainText("12.6%"); });
