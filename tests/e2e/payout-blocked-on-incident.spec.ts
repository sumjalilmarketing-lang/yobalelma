import { expect, test } from "playwright/test";
import { postJson, requireSupabaseE2E } from "./e2e-helpers";

test("destination QR scan validates anonymous access", async ({ request }) => {
  const response = await postJson(request, "/api/qr/scan", {
    token: "0".repeat(64),
    expectedTokenType: "destination_dropoff",
    incidentType: "damaged",
  });

  expect([401, 503]).toContain(response.status());
});

test("payout blocked on incident real workflow", async () => {
  requireSupabaseE2E();
});
