export const publicSignupRoles = ["client", "local_transporter", "traveler"] as const;

export const platformRoles = [
  "client",
  "local_transporter",
  "traveler",
  "relay_agent",
  "hub_agent",
  "hub_manager",
  "collection_driver",
  "collection_manager",
  "relay_manager",
  "operations_manager",
  "support_agent",
  "finance_agent",
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
  "finance:read",
  "finance:write",
  "support:read",
  "support:write",
  "kyc:read",
  "kyc:review",
  "admin:read",
  "admin:write",
  "operations:read",
  "operations:write",
  "super_admin:write",
] as const;

export type PlatformPermission = (typeof platformPermissions)[number];

export const roleDashboardPath: Record<PlatformRole, string> = {
  client: "/dashboard/client",
  local_transporter: "/dashboard/transporter",
  traveler: "/dashboard/traveler",
  relay_agent: "/dashboard/relay",
  hub_agent: "/dashboard/hub",
  hub_manager: "/dashboard/hub",
  collection_driver: "/dashboard/collection",
  collection_manager: "/dashboard/collection",
  relay_manager: "/dashboard/relay",
  operations_manager: "/dashboard/operations",
  support_agent: "/dashboard/support",
  finance_agent: "/dashboard/admin/payments",
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
  hub_manager: [
    "hub:read",
    "hub:write",
    "shipment:track",
    "qr:read",
    "qr:write",
    "traveler:read",
    "support:read",
    "admin:read",
  ],
  collection_driver: [
    "collection:read",
    "collection:write",
    "shipment:track",
    "support:read",
  ],
  collection_manager: [
    "collection:read",
    "collection:write",
    "relay:read",
    "hub:read",
    "shipment:track",
    "support:read",
  ],
  relay_manager: [
    "relay:read",
    "relay:write",
    "collection:read",
    "shipment:track",
    "qr:read",
    "qr:write",
    "support:read",
  ],
  operations_manager: [
    "shipment:read",
    "shipment:track",
    "transporter:read",
    "mission:read",
    "dispatch:read",
    "dispatch:write",
    "operations:read",
    "operations:write",
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
  finance_agent: [
    "payment:read",
    "payment:write",
    "payout:read",
    "payout:write",
    "finance:read",
    "finance:write",
    "support:read",
    "admin:read",
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
    "finance:read",
    "finance:write",
    "support:read",
    "support:write",
    "kyc:read",
    "kyc:review",
    "admin:read",
    "admin:write",
    "operations:read",
    "operations:write",
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
