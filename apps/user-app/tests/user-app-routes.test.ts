import { existsSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const appRoot = path.resolve(__dirname, "..");

const requiredRoutes = [
  "app/page.tsx",
  "app/how-it-works/page.tsx",
  "app/security/page.tsx",
  "app/pricing/page.tsx",
  "app/tracking/page.tsx",
  "app/tracking/[trackingCode]/page.tsx",
  "app/relay-points/page.tsx",
  "app/prohibited-items/page.tsx",
  "app/support/page.tsx",
  "app/terms/page.tsx",
  "app/privacy/page.tsx",
  "app/auth/login/page.tsx",
  "app/auth/register/page.tsx",
  "app/client/page.tsx",
  "app/client/shipments/new/page.tsx",
  "app/transporter/page.tsx",
  "app/transporter/missions/[id]/page.tsx",
  "app/traveler/page.tsx",
  "app/traveler/trips/new/page.tsx",
  "app/api/health/route.ts",
  "next.config.ts",
  "middleware.ts"
];

describe("user-app physical migration", () => {
  it("contains the required independent app routes", () => {
    for (const route of requiredRoutes) {
      expect(existsSync(path.join(appRoot, route)), route).toBe(true);
    }
  });
});
