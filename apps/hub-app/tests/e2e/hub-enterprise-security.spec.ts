import { expect, test } from "@playwright/test";
import { signInHub } from "./hub-test-utils";
test("export rejects a hub outside the visible scope", async ({ page }) => { await signInHub(page); const response = await page.request.get("/api/hub/exports?type=inventory&format=csv&hub=11111111-1111-4111-8111-111111111111"); expect(response.status()).toBe(403); });
