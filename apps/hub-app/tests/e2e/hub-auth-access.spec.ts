import { expect, test } from "@playwright/test";
import { resetHub, signInHub } from "./hub-test-utils";

test("Hub routes redirect anonymous users and accept Hub agents", async ({ page }) => {
  await page.goto("/hub");
  await expect(page).toHaveURL(/\/auth\/sign-in/);

  await signInHub(page, "hub_agent");
  await resetHub(page);
  await expect(page.getByText("Centre operationnel Hub")).toBeVisible();
});

test("operations manager can orchestrate Hub operations and reports", async ({ page }) => {
  await signInHub(page, "operations_manager");
  const response = await page.request.post("/api/hub/inspection", {
    form: {
      decision: "approved",
      measuredWeightKg: "4.2",
      packagingQuality: "acceptable",
      shipmentId: "shp-001",
    },
  });

  expect([200, 303]).toContain(response.status());
  await page.goto("/hub/reports");
  await expect(page.getByRole("heading", { name: "Rapports" })).toBeVisible();
});
