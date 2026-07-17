import { expect, test } from "@playwright/test";
import { signInHub } from "./hub-test-utils";
test("global search returns ranked authorized results", async ({ page }) => { await signInHub(page); await page.goto("/hub/search"); const search = page.getByTestId("global-search"); await search.locator('input[name="q"]').fill("DSS"); await search.locator('button[type="submit"]').click(); await expect(search).toContainText("DSS-DAKAR"); });
