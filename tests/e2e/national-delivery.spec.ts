import { test } from "playwright/test";
import { expectLandingReady, expectProtectedOrReady, requireSupabaseE2E } from "./e2e-helpers";

test("application shell exposes the national client entrypoints", async ({ request }) => {
  await expectLandingReady(request);
  await expectProtectedOrReady(request, "/dashboard/client/shipments/new");
});

test("national delivery real workflow", async ({ request }) => {
  requireSupabaseE2E();
  await expectProtectedOrReady(request, "/dashboard/client/shipments/new");
});
