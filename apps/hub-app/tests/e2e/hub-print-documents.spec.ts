import { expect, test } from "@playwright/test";
import { signInHub } from "./hub-test-utils";
test("print document is A4-ready and contains a QR", async ({ page }) => { await signInHub(page); const response = await page.request.get("/api/hub/exports?type=manifest&format=print"); expect(response.ok()).toBeTruthy(); const html = await response.text(); expect(html).toContain("@page{size:A4"); expect(html).toContain("data:image/png;base64"); });
