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

export const platformPermissions = [
  "client:read",
  "client:write",
  "shipment:read",
  "shipment:write",
  "shipment:track",
  "shipment:dispute",
  "transporter:read",
  "transporter:write",
  "mission:read",
  "mission:write",
  "dispatch:read",
  "dispatch:write",
  "relay:read",
  "relay:write",
  "collection:read",
  "collection:write",
  "traveler:read",
  "traveler:write",
  "hub:read",
  "hub:write",
  "qr:read",
  "qr:write",
  "payment:read",
  "payment:write",
  "payout:read",
  "payout:write",
  "support:read",
  "support:write",
  "kyc:read",
  "kyc:review",
  "admin:read",
  "admin:write",
  "super_admin:write",
] as const;

export type PlatformPermission = (typeof platformPermissions)[number];

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

export const rolePermissions: Record<PlatformRole, PlatformPermission[]> = {
  client: [
    "client:read",
    "client:write",
    "shipment:read",
    "shipment:write",
    "shipment:track",
    "shipment:dispute",
    "payment:read",
    "support:read",
    "support:write",
  ],
  local_transporter: [
    "transporter:read",
    "transporter:write",
    "mission:read",
    "mission:write",
    "shipment:track",
    "payout:read",
    "support:read",
    "support:write",
  ],
  traveler: [
    "traveler:read",
    "traveler:write",
    "shipment:track",
    "qr:read",
    "payout:read",
    "support:read",
    "support:write",
  ],
  relay_agent: [
    "relay:read",
    "relay:write",
    "shipment:track",
    "qr:read",
    "qr:write",
    "support:read",
  ],
  hub_agent: [
    "hub:read",
    "hub:write",
    "shipment:track",
    "qr:read",
    "qr:write",
    "traveler:read",
    "support:read",
  ],
  collection_driver: [
    "collection:read",
    "collection:write",
    "shipment:track",
    "support:read",
  ],
  operations_manager: [
    "shipment:read",
    "shipment:track",
    "transporter:read",
    "mission:read",
    "dispatch:read",
    "dispatch:write",
    "relay:read",
    "collection:read",
    "hub:read",
    "traveler:read",
    "qr:read",
    "support:read",
  ],
  support_agent: [
    "client:read",
    "shipment:read",
    "shipment:track",
    "payment:read",
    "payout:read",
    "support:read",
    "support:write",
    "kyc:read",
  ],
  admin: [
    "client:read",
    "shipment:read",
    "shipment:write",
    "shipment:track",
    "transporter:read",
    "mission:read",
    "dispatch:read",
    "dispatch:write",
    "relay:read",
    "relay:write",
    "collection:read",
    "collection:write",
    "traveler:read",
    "traveler:write",
    "hub:read",
    "hub:write",
    "qr:read",
    "qr:write",
    "payment:read",
    "payment:write",
    "payout:read",
    "payout:write",
    "support:read",
    "support:write",
    "kyc:read",
    "kyc:review",
    "admin:read",
    "admin:write",
  ],
  super_admin: [...platformPermissions],
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

export function roleHasPermission(role: PlatformRole, permission: PlatformPermission) {
  return rolePermissions[role].includes(permission);
}

export function roleHasAnyPermission(
  role: PlatformRole,
  permissions: PlatformPermission[],
) {
  return permissions.some((permission) => roleHasPermission(role, permission));
}
