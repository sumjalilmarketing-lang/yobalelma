import { describe, expect, it } from "vitest";
import {
  roleHasAnyPermission,
  roleHasPermission,
} from "@/lib/auth/roles";

describe("RBAC permissions", () => {
  it("keeps clients out of hub and admin permissions", () => {
    expect(roleHasPermission("client", "shipment:write")).toBe(true);
    expect(roleHasPermission("client", "hub:write")).toBe(false);
    expect(roleHasPermission("client", "admin:write")).toBe(false);
  });

  it("keeps relay agents away from payout release permissions", () => {
    expect(roleHasPermission("relay_agent", "relay:write")).toBe(true);
    expect(roleHasPermission("relay_agent", "payout:write")).toBe(false);
  });

  it("keeps support agents away from system settings", () => {
    expect(roleHasPermission("support_agent", "support:write")).toBe(true);
    expect(roleHasPermission("support_agent", "admin:write")).toBe(false);
  });

  it("grants global permissions only to super admin", () => {
    expect(roleHasPermission("admin", "super_admin:write")).toBe(false);
    expect(roleHasPermission("super_admin", "super_admin:write")).toBe(true);
  });

  it("checks grouped permissions", () => {
    expect(roleHasAnyPermission("operations_manager", ["dispatch:write", "admin:write"])).toBe(true);
    expect(roleHasAnyPermission("local_transporter", ["hub:write", "admin:write"])).toBe(false);
  });
});

