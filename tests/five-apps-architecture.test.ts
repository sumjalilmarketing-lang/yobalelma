import { describe, expect, it } from "vitest";
import {
  allowedRolesForApp,
  canAccessYobalelmaApp,
} from "@/packages/auth/src";
import { yobalelmaApps } from "@/packages/config/src";

describe("five apps architecture", () => {
  it("declares the five target applications", () => {
    expect(yobalelmaApps.map((app) => app.id)).toEqual([
      "user-app",
      "hub-app",
      "collection-app",
      "relay-app",
      "admin-app",
    ]);
  });

  it("keeps external roles out of internal apps", () => {
    for (const role of ["client", "local_transporter", "traveler"]) {
      expect(canAccessYobalelmaApp("hub-app", role)).toBe(false);
      expect(canAccessYobalelmaApp("collection-app", role)).toBe(false);
      expect(canAccessYobalelmaApp("relay-app", role)).toBe(false);
      expect(canAccessYobalelmaApp("admin-app", role)).toBe(false);
    }
  });

  it("allows each internal application to its dedicated roles", () => {
    expect(canAccessYobalelmaApp("hub-app", "hub_agent")).toBe(true);
    expect(canAccessYobalelmaApp("hub-app", "hub_manager")).toBe(true);
    expect(canAccessYobalelmaApp("collection-app", "collection_driver")).toBe(true);
    expect(canAccessYobalelmaApp("collection-app", "collection_manager")).toBe(true);
    expect(canAccessYobalelmaApp("relay-app", "relay_agent")).toBe(true);
    expect(canAccessYobalelmaApp("relay-app", "relay_manager")).toBe(true);
    expect(canAccessYobalelmaApp("admin-app", "finance_agent")).toBe(true);
  });

  it("exposes typed allowed roles per app", () => {
    expect(allowedRolesForApp("user-app")).toEqual([
      "client",
      "local_transporter",
      "traveler",
    ]);
  });
});
