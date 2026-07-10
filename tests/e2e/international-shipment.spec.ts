import { test } from "playwright/test";
import { expectLandingReady, expectProtectedOrReady, requireSupabaseE2E } from "./e2e-helpers";

test("application shell exposes international traveler and hub entrypoints", async ({ request }) => {
  await expectLandingReady(request);
  await expectProtectedOrReady(request, "/dashboard/traveler/trips/new");
});

test("international shipment real workflow", async ({ request }) => {
  requireSupabaseE2E();
  await expectProtectedOrReady(request, "/dashboard/hub/handover");
});
