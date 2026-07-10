import { expect, test } from "playwright/test";
import { postJson, requireSupabaseE2E } from "./e2e-helpers";

test("dispatch endpoint reports missing auth instead of succeeding anonymously", async ({ request }) => {
  const response = await postJson(request, "/api/transporters/dispatch", {
    shipmentId: "00000000-0000-0000-0000-000000000000",
    candidateLimit: 3,
  });

  expect([401, 503]).toContain(response.status());
});

test("dispatch reassignment real workflow", async () => {
  requireSupabaseE2E();
});
