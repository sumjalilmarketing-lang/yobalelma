import { describe, expect, it } from "vitest";
import { allowedRolesForApp, canAccessYobalelmaApp } from "@/packages/auth/src";
import { detectShipmentScope, detectShipmentType } from "@/lib/shipments/estimation";

const externalRoles = ["client", "local_transporter", "traveler"];

describe("user-app workflow rules", () => {
  it("keeps user-app limited to external roles", () => {
    expect(allowedRolesForApp("user-app")).toEqual(externalRoles);
    expect(canAccessYobalelmaApp("user-app", "client")).toBe(true);
    expect(canAccessYobalelmaApp("user-app", "hub_agent")).toBe(false);
    expect(canAccessYobalelmaApp("user-app", "admin")).toBe(false);
  });

  it("detects national and international shipments server-side", () => {
    expect(detectShipmentScope("SN", "sn")).toBe("national");
    expect(detectShipmentType("SN", "FR")).toBe("international");
  });
});
