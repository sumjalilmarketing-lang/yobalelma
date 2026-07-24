import { expect, test } from "@playwright/test";
import { signInHub } from "./hub-test-utils";
test("operations manager can compare authorized hubs", async ({ page }) => { await signInHub(page, "operations_manager"); await page.goto("/hub/control-tower"); await expect(page.getByTestId("control-tower")).toBeVisible(); await expect(page.getByText("DSS-DAKAR")).toBeVisible(); await expect(page.getByText("CDG-PARIS")).toBeVisible(); });
