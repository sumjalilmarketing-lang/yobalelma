import { expect, test } from "@playwright/test";
import { generatePickupQr, resetHub, signInHub, visualPath } from "./hub-test-utils";

test("captures the Hub visual demo screens", async ({ page }) => {
  await signInHub(page, "hub_manager");
  await resetHub(page);

  const captures = [
    ["/hub", "01-dashboard.png"],
    ["/hub/inbound", "02-inbound.png"],
    ["/hub/inbound/manifest-dss-001", "03-manifest.png"],
    ["/hub/scanner", "04-scanner.png"],
    ["/hub/inspection", "05-inspection.png"],
    ["/hub/storage", "06-storage.png"],
    ["/hub/inventory", "07-inventory.png"],
    ["/hub/trips", "08-trips.png"],
    ["/hub/capacities", "09-capacities.png"],
    ["/hub/batches", "10-batches.png"],
    ["/hub/anomalies", "13-anomalies.png"],
    ["/hub/reports", "14-reports.png"],
  ] as const;

  for (const [route, fileName] of captures) {
    await page.goto(route);
    await expect(page.locator("main")).toBeVisible();
    await page.screenshot({ fullPage: true, path: visualPath(fileName) });
  }

  await generatePickupQr(page);
  await page.goto("/hub/batches/batch-cdg-001");
  await page.screenshot({ fullPage: true, path: visualPath("11-pickup-qr.png") });
  await page.goto("/hub/handover/batch-cdg-001");
  await page.screenshot({ fullPage: true, path: visualPath("12-handover.png") });

  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/hub");
  await page.screenshot({ fullPage: true, path: visualPath("15-mobile-dashboard.png") });

  await page.setViewportSize({ width: 820, height: 1180 });
  await page.goto("/hub/inventory");
  await page.screenshot({ fullPage: true, path: visualPath("16-tablet-inventory.png") });

  await page.setViewportSize({ width: 1366, height: 768 });
  await page.goto("/hub");
  await page.getByLabel("Langue").selectOption("ar");
  await page.screenshot({ fullPage: true, path: visualPath("17-arabic-rtl.png") });
});
