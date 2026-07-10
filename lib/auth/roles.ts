export const publicSignupRoles = ["client", "local_transporter", "traveler"] as const;

export const platformRoles = [
  "client",
  "local_transporter",
  "traveler",
  "relay_agent",
  "hub_agent",
  "collection_driver",
  "operations_manager",
  "support_agent",
  "admin",
  "super_admin",
] as const;

export type PublicSignupRole = (typeof publicSignupRoles)[number];
export type PlatformRole = (typeof platformRoles)[number];

export const roleDashboardPath: Record<PlatformRole, string> = {
  client: "/dashboard/client",
  local_transporter: "/dashboard/transporter",
  traveler: "/dashboard/traveler",
  relay_agent: "/dashboard/relay",
  hub_agent: "/dashboard/hub",
  collection_driver: "/dashboard/collection",
  operations_manager: "/dashboard/operations",
  support_agent: "/dashboard/support",
  admin: "/dashboard/admin",
  super_admin: "/dashboard/admin",
};

export function isPublicSignupRole(role: string): role is PublicSignupRole {
  return publicSignupRoles.includes(role as PublicSignupRole);
}

export function isPlatformRole(role: string): role is PlatformRole {
  return platformRoles.includes(role as PlatformRole);
}

export function getRoleDashboardPath(role: PlatformRole) {
  return roleDashboardPath[role];
}

