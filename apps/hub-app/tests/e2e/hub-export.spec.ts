import { expect, test } from "@playwright/test";
import { signInHub } from "./hub-test-utils";
test("CSV export is permission-scoped and timestamped", async ({ page }) => { await signInHub(page, "hub_supervisor"); const response = await page.request.get("/api/hub/exports?type=inventory&format=csv"); expect(response.ok()).toBeTruthy(); expect(response.headers()["content-type"]).toContain("text/csv"); expect(await response.text()).toContain("DSS-DAKAR"); });
