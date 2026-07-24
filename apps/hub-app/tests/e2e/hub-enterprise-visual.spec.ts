import path from "node:path";
import { expect, test } from "@playwright/test";
import { signInHub } from "./hub-test-utils";

const gallery = path.resolve(process.cwd(), "../../docs/visual-demo/hub-enterprise");
async function capture(page: import("@playwright/test").Page, route: string, file: string, viewport = { width: 1440, height: 1000 }) { await page.setViewportSize(viewport); await page.goto(route); await expect(page.locator("main")).toBeVisible(); await page.screenshot({ fullPage: true, path: path.join(gallery, file) }); }

test("captures Enterprise Hub gallery", async ({ page }) => {
  await signInHub(page, "hub_manager");
  await capture(page, "/hub/control-tower", "01-control-tower.png");
  await capture(page, "/hub/control-tower?view=executive", "02-multi-hubs.png");
  await capture(page, "/hub", "03-dashboard.png");
  await capture(page, "/hub/agents", "04-agent-performance.png");
  await capture(page, "/hub/search", "05-global-search.png");
  await capture(page, "/hub/stock-monitoring", "06-stock-monitoring.png");
  await capture(page, "/hub/incidents", "07-incidents.png");
  await capture(page, "/hub/reports", "08-reporting.png");
  await capture(page, "/hub/exports", "09-exports.png");
  await capture(page, "/hub/documents", "10-documents.png");
  await capture(page, "/hub/alerts", "11-alerts.png");
  await capture(page, "/hub/system-health", "12-system-health.png");
  await capture(page, "/hub/audit", "13-audit.png");
  await capture(page, "/hub/control-tower", "14-mobile.png", { width: 390, height: 844 });
  await capture(page, "/hub/control-tower", "15-tablet.png", { width: 820, height: 1180 });
  await page.setViewportSize({ width: 1440, height: 1000 }); await page.goto("/hub/control-tower"); await page.getByLabel("Langue").selectOption("en"); await page.screenshot({ fullPage: true, path: path.join(gallery, "16-english.png") });
  await page.getByLabel("Langue").selectOption("ar"); await expect(page.locator("html")).toHaveAttribute("dir", "rtl"); await page.screenshot({ fullPage: true, path: path.join(gallery, "17-arabic-rtl.png") });
});
