import { expect, test } from "@playwright/test";
import { prepareParisShipment, resetHub, signInHub } from "./hub-test-utils";

test("double reservation is refused after the first active reservation", async ({ page }) => {
  await signInHub(page, "hub_manager");
  await resetHub(page);
  await prepareParisShipment(page);
  await page.request.post("/api/hub/batches/reserve", {
    form: {
      batchId: "batch-cdg-001",
      returnTo: "/hub/batches/batch-cdg-001",
      shipmentId: "shp-006",
    },
  });
  const response = await page.request.post("/api/hub/batches/reserve", {
    form: {
      batchId: "batch-cdg-001",
      returnTo: "/hub/batches/batch-cdg-001",
      shipmentId: "shp-006",
    },
    maxRedirects: 0,
  });

  expect([303, 409]).toContain(response.status());
});
