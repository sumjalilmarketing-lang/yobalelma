import { describe, expect, it } from "vitest";
import { canManageMissions, getGovernanceRole, governanceDirections, governanceRoles, governanceServices, visibleDirectionsForRoles } from "../src/lib/governance-catalog";

describe("governance catalog", () => {
  it("attaches every role to exactly one valid service and direction", () => {
    for (const role of governanceRoles) {
      const service = governanceServices.find((item) => item.id === role.serviceId);
      expect(service, role.id).toBeTruthy();
      expect(service?.directionId, role.id).toBe(role.directionId);
    }
  });

  it("exposes all eight directions only to platform governance", () => {
    expect(visibleDirectionsForRoles(["super_admin"])).toHaveLength(8);
    expect(visibleDirectionsForRoles(["finance_manager"]).map((item) => item.id)).toEqual(["finance"]);
    expect(governanceDirections).toHaveLength(8);
  });

  it("limits mission management to the responsible service", () => {
    expect(canManageMissions(["finance_manager"], "finance_control")).toBe(true);
    expect(canManageMissions(["finance_manager"], "hub_operations")).toBe(false);
    expect(canManageMissions(["finance_agent"], "finance_control")).toBe(false);
    expect(getGovernanceRole("customs_agent")?.serviceId).toBe("customs_operations");
  });
});
