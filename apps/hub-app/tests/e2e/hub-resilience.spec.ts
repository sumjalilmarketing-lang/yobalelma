import { expect, test } from "@playwright/test";
import { signInHub } from "./hub-test-utils";
test("duplicate read requests remain idempotent", async ({ page }) => { await signInHub(page); const [first, second] = await Promise.all([page.request.get("/api/hub/search?q=DSS"), page.request.get("/api/hub/search?q=DSS")]); expect(first.status()).toBe(200); expect(second.status()).toBe(200); expect(await first.json()).toEqual(await second.json()); });
