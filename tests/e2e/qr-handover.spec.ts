import { expect, test } from "playwright/test";
import { postJson, requireSupabaseE2E } from "./e2e-helpers";

test("QR endpoints do not expose success anonymously", async ({ request }) => {
  const response = await postJson(request, "/api/qr/handover", {
    batchId: "00000000-0000-0000-0000-000000000000",
    tokenType: "origin_pickup",
    expiresInMinutes: 30,
  });

  expect([401, 503]).toContain(response.status());
});

test("QR handover real workflow", async () => {
  requireSupabaseE2E();
});
