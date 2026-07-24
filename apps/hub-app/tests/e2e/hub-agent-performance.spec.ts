import { expect, test } from "@playwright/test";
import { signInHub } from "./hub-test-utils";
test("supervisor sees assistive agent metrics", async ({ page }) => { await signInHub(page, "hub_supervisor"); await page.goto("/hub/agents"); await expect(page.getByTestId("agent-performance")).toContainText("Awa Diop"); });
