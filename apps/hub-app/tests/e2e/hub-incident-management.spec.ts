import { expect, test } from "@playwright/test";
import { signInHub } from "./hub-test-utils";
test("incident center exposes creation and SLA tracking", async ({ page }) => { await signInHub(page, "hub_supervisor"); await page.goto("/hub/incidents"); const center = page.getByTestId("incident-center"); await expect(center).toContainText("INC-DSS-1042"); await expect(center.locator('form[action="/api/hub/anomalies"]')).toBeVisible(); });
