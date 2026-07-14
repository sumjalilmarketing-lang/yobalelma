import { describe, expect, it } from "vitest";
import { allowedRolesForApp, canAccessYobalelmaApp } from "@/packages/auth/src";
import {
  getUserAppSpaces,
  mergePlatformRoles,
  selectRoleForAccess,
} from "@/lib/auth/roles";
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

  it("merges legacy, assignment and user_roles into a unique role list", () => {
    expect(
      mergePlatformRoles(
        ["sender", "client"],
        ["local_transporter", "client"],
        ["traveler", "both"],
      ),
    ).toEqual(["client", "local_transporter", "traveler"]);
  });

  it("selects the requested space from a multirole account", () => {
    const roles = mergePlatformRoles(["client"], ["traveler"], ["local_transporter"]);

    expect(selectRoleForAccess(roles, ["traveler"])).toBe("traveler");
    expect(selectRoleForAccess(roles, ["admin"])).toBeNull();
  });

  it("shows only external user-app spaces in the switcher", () => {
    expect(getUserAppSpaces(["client", "admin", "traveler"])).toEqual([
      { href: "/client", label: "Espace client", role: "client" },
      { href: "/traveler", label: "Espace voyageur", role: "traveler" },
    ]);
  });
});
