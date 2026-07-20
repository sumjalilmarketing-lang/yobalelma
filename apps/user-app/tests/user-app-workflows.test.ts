import { describe, expect, it } from "vitest";
import { allowedRolesForApp, canAccessYobalelmaApp } from "@/packages/auth/src";
import {
  getUserAppSpaces,
  mergePlatformRoles,
  selectRoleForAccess,
} from "@/lib/auth/roles";
import { detectShipmentScope, detectShipmentType } from "@/lib/shipments/estimation";
import { getWorkspaceConfig } from "@/lib/dashboard/workspace-configs";
import { DEFAULT_USER_ERROR, toUserFacingMessage } from "@/lib/presentation/user-facing-copy";

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

  it("never exposes technical errors in a visible message", () => {
    expect(toUserFacingMessage('relation "shipments" does not exist')).toBe(DEFAULT_USER_ERROR);
    expect(toUserFacingMessage("Invalid login credentials")).toBe(
      "L’adresse e-mail ou le mot de passe est incorrect.",
    );
    expect(toUserFacingMessage("Ton profil a été mis à jour.")).toBe(
      "Ton profil a été mis à jour.",
    );
  });

  it("keeps external workspaces free of implementation vocabulary", () => {
    const keys = [
      "client/tracking",
      "client/payments",
      "client/messages",
      "client/support",
      "client/addresses",
      "client/profile",
      "client/notifications",
      "transporter/earnings",
      "transporter/kyc",
      "transporter/ratings",
      "transporter/support",
      "transporter/profile",
      "transporter/notifications",
      "traveler/tickets",
      "traveler/capacity",
      "traveler/assignments",
      "traveler/earnings",
      "traveler/payments",
      "traveler/history",
      "traveler/support",
      "traveler/profile",
      "traveler/notifications",
    ];
    const visibleCopy = keys.flatMap((key) => {
      const config = getWorkspaceConfig(key);

      expect(config, key).not.toBeNull();
      return config
        ? [
            config.title,
            config.description,
            config.emptyTitle ?? "",
            ...config.checkpoints,
            ...config.actions.map((action) => action.label),
            ...config.metrics.map((metric) => metric.label),
          ]
        : [];
    });

    expect(visibleCopy.join(" ")).not.toMatch(
      /supabase|database|backend|postgres|bucket|rpc|sql|sandbox|requester_id|recipient_id|shipment_status|local_delivery|provider|trigger/i,
    );
  });
});
