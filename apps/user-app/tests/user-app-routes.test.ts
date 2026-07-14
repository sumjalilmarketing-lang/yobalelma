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
  "app/auth/forgot-password/page.tsx",
  "app/auth/reset-password/page.tsx",
  "app/client/page.tsx",
  "app/client/addresses/page.tsx",
  "app/client/messages/page.tsx",
  "app/client/notifications/page.tsx",
  "app/client/payments/page.tsx",
  "app/client/profile/page.tsx",
  "app/client/support/page.tsx",
  "app/client/tracking/page.tsx",
  "app/client/shipments/page.tsx",
  "app/client/shipments/new/page.tsx",
  "app/client/shipments/[id]/page.tsx",
  "app/transporter/page.tsx",
  "app/transporter/availability/page.tsx",
  "app/transporter/earnings/page.tsx",
  "app/transporter/kyc/page.tsx",
  "app/transporter/missions/page.tsx",
  "app/transporter/missions/active/page.tsx",
  "app/transporter/missions/available/page.tsx",
  "app/transporter/missions/history/page.tsx",
  "app/transporter/missions/[id]/page.tsx",
  "app/transporter/notifications/page.tsx",
  "app/transporter/profile/page.tsx",
  "app/transporter/ratings/page.tsx",
  "app/transporter/support/page.tsx",
  "app/transporter/vehicle/page.tsx",
  "app/transporter/zones/page.tsx",
  "app/traveler/page.tsx",
  "app/traveler/assignments/page.tsx",
  "app/traveler/capacity/page.tsx",
  "app/traveler/earnings/page.tsx",
  "app/traveler/history/page.tsx",
  "app/traveler/kyc/page.tsx",
  "app/traveler/notifications/page.tsx",
  "app/traveler/payments/page.tsx",
  "app/traveler/profile/page.tsx",
  "app/traveler/qr-codes/page.tsx",
  "app/traveler/support/page.tsx",
  "app/traveler/tickets/page.tsx",
  "app/traveler/trips/page.tsx",
  "app/traveler/trips/new/page.tsx",
  "app/traveler/trips/[id]/page.tsx",
  "app/recipient/delivery/page.tsx",
  "app/recipient/delivery/[shipmentId]/page.tsx",
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
