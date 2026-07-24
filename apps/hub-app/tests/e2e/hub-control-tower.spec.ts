import { expect, test } from "@playwright/test";
import { signInHub } from "./hub-test-utils";
test("control tower exposes network status and capacity", async ({ page }) => { await signInHub(page, "hub_manager"); await page.goto("/hub/control-tower"); await expect(page.getByTestId("control-tower")).toContainText("DSS-DAKAR"); });
