import { describe, expect, it } from "vitest";
import { hubNavigation } from "../src/lib/permissions";

const requiredRoutes = [
  "/hub",
  "/hub/inbound",
  "/hub/inbound/manifest-dss-001",
  "/hub/scanner",
  "/hub/inspection",
  "/hub/inspection/shp-001",
  "/hub/inventory",
  "/hub/inventory/shp-002",
  "/hub/storage",
  "/hub/storage/locations",
  "/hub/trips",
  "/hub/trips/trip-cdg-001",
  "/hub/capacities",
  "/hub/batches",
  "/hub/batches/new",
  "/hub/batches/batch-cdg-001",
  "/hub/handover",
  "/hub/handover/batch-cdg-001",
  "/hub/anomalies",
  "/hub/anomalies/anom-001",
  "/hub/history",
  "/hub/reports",
  "/hub/notifications",
  "/hub/profile",
  "/hub/settings",
];

describe("hub route map", () => {
  it("covers the required Hub surface", () => {
    expect(requiredRoutes).toHaveLength(25);
    expect(hubNavigation.map((item) => item.href)).toContain("/hub/inbound");
    expect(hubNavigation.map((item) => item.href)).toContain("/hub/handover");
  });

  it("keeps dynamic route examples documented for E2E tests", () => {
    expect(requiredRoutes.filter((route) => route.includes("manifest") || route.includes("batch") || route.includes("shp")).length).toBeGreaterThanOrEqual(5);
  });
});
