export const publicSignupRoles = ["client", "local_transporter", "traveler"] as const;
export const userAppSpaceRoles = ["client", "local_transporter", "traveler"] as const;

export const platformRoles = [
  "client",
  "local_transporter",
  "traveler",
  "relay_agent",
  "hub_agent",
  "hub_supervisor",
  "hub_manager",
  "collection_driver",
  "collection_manager",
  "collection_supervisor",
  "relay_manager",
  "operations_manager",
  "dispatch_manager",
  "local_delivery_manager",
  "traveler_manager",
  "traveler_validation",
  "traveler_support",
  "customs_manager",
  "customs_agent",
  "compliance_manager",
  "compliance_agent",
  "finance_manager",
  "support_agent",
  "finance_agent",
  "accounting_agent",
  "reconciliation_agent",
  "payment_agent",
  "commission_agent",
  "refund_agent",
  "customer_support_manager",
  "customer_support_agent",
  "security_manager",
  "auditor",
  "partner_manager",
  "orange_partner_manager",
  "relay_partner_manager",
  "carrier_partner_manager",
  "airline_partner_manager",
  "admin",
  "super_admin",
] as const;

export type PublicSignupRole = (typeof publicSignupRoles)[number];
export type UserAppSpaceRole = (typeof userAppSpaceRoles)[number];
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
  hub_supervisor: "/dashboard/hub",
  hub_manager: "/dashboard/hub",
  collection_driver: "/dashboard/collection",
  collection_manager: "/dashboard/collection",
  collection_supervisor: "/command",
  relay_manager: "/dashboard/relay",
  operations_manager: "/dashboard/operations",
  dispatch_manager: "/command",
  local_delivery_manager: "/command",
  traveler_manager: "/command",
  traveler_validation: "/command",
  traveler_support: "/command",
  customs_manager: "/command",
  customs_agent: "/command",
  compliance_manager: "/command",
  compliance_agent: "/command",
  finance_manager: "/command",
  support_agent: "/dashboard/support",
  finance_agent: "/dashboard/admin/payments",
  accounting_agent: "/command",
  reconciliation_agent: "/command",
  payment_agent: "/command",
  commission_agent: "/command",
  refund_agent: "/command",
  customer_support_manager: "/command",
  customer_support_agent: "/command",
  security_manager: "/command",
  auditor: "/command",
  partner_manager: "/command",
  orange_partner_manager: "/command",
  relay_partner_manager: "/command",
  carrier_partner_manager: "/command",
  airline_partner_manager: "/command",
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
  hub_supervisor: [
    "hub:read",
    "hub:write",
    "shipment:track",
    "qr:read",
    "qr:write",
    "traveler:read",
    "operations:read",
    "support:read",
    "admin:read",
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
  collection_supervisor: ["collection:read", "collection:write", "shipment:track", "operations:read", "support:read"],
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
  dispatch_manager: ["shipment:read", "shipment:track", "mission:read", "mission:write", "dispatch:read", "dispatch:write", "operations:read", "operations:write"],
  local_delivery_manager: ["shipment:read", "shipment:track", "transporter:read", "mission:read", "mission:write", "dispatch:read", "operations:read", "operations:write"],
  traveler_manager: ["traveler:read", "traveler:write", "shipment:track", "kyc:read", "kyc:review", "operations:read", "support:read"],
  traveler_validation: ["traveler:read", "traveler:write", "kyc:read", "kyc:review", "support:read"],
  traveler_support: ["traveler:read", "shipment:track", "support:read", "support:write"],
  customs_manager: ["shipment:read", "shipment:track", "operations:read", "operations:write", "kyc:read", "kyc:review", "admin:read"],
  customs_agent: ["shipment:read", "shipment:track", "operations:read", "operations:write", "kyc:read"],
  compliance_manager: ["shipment:read", "shipment:track", "operations:read", "operations:write", "kyc:read", "kyc:review", "admin:read"],
  compliance_agent: ["shipment:read", "shipment:track", "operations:read", "kyc:read", "kyc:review"],
  finance_manager: ["payment:read", "payment:write", "payout:read", "payout:write", "finance:read", "finance:write", "admin:read", "operations:read"],
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
  accounting_agent: ["payment:read", "payout:read", "finance:read", "finance:write", "admin:read"],
  reconciliation_agent: ["payment:read", "payment:write", "payout:read", "finance:read", "finance:write", "admin:read"],
  payment_agent: ["payment:read", "payment:write", "payout:read", "finance:read", "finance:write"],
  commission_agent: ["payment:read", "payout:read", "payout:write", "finance:read", "finance:write"],
  refund_agent: ["payment:read", "payment:write", "finance:read", "finance:write", "support:read"],
  customer_support_manager: ["client:read", "shipment:read", "shipment:track", "payment:read", "support:read", "support:write", "kyc:read", "admin:read"],
  customer_support_agent: ["client:read", "shipment:read", "shipment:track", "payment:read", "support:read", "support:write", "kyc:read"],
  security_manager: ["shipment:read", "shipment:track", "operations:read", "operations:write", "admin:read", "support:read", "kyc:read"],
  auditor: ["shipment:read", "shipment:track", "operations:read", "admin:read", "finance:read", "support:read", "kyc:read"],
  partner_manager: ["operations:read", "operations:write", "relay:read", "hub:read", "transporter:read", "admin:read"],
  orange_partner_manager: ["operations:read", "relay:read", "finance:read", "admin:read"],
  relay_partner_manager: ["operations:read", "relay:read", "relay:write", "collection:read", "admin:read"],
  carrier_partner_manager: ["operations:read", "transporter:read", "mission:read", "dispatch:read", "admin:read"],
  airline_partner_manager: ["operations:read", "traveler:read", "hub:read", "shipment:read", "admin:read"],
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

export function normalizePlatformRole(role: unknown): PlatformRole | null {
  if (typeof role !== "string") {
    return null;
  }

  if (role === "sender") {
    return "client";
  }

  if (role === "both") {
    return "client";
  }

  return isPlatformRole(role) ? role : null;
}

export function expandPlatformRoles(role: unknown): PlatformRole[] {
  if (typeof role !== "string") {
    return [];
  }

  if (role === "sender") {
    return ["client"];
  }

  if (role === "both") {
    return ["client", "traveler"];
  }

  const normalizedRole = normalizePlatformRole(role);

  return normalizedRole ? [normalizedRole] : [];
}

export function mergePlatformRoles(...roleGroups: Array<readonly unknown[]>): PlatformRole[] {
  const roles = new Set<PlatformRole>();

  for (const roleGroup of roleGroups) {
    for (const role of roleGroup) {
      for (const expandedRole of expandPlatformRoles(role)) {
        roles.add(expandedRole);
      }
    }
  }

  return [...roles];
}

export function selectRoleForAccess(
  assignedRoles: readonly PlatformRole[],
  allowedRoles: readonly PlatformRole[],
) {
  return assignedRoles.find((role) => allowedRoles.includes(role)) ?? null;
}

export function isUserAppSpaceRole(role: PlatformRole): role is UserAppSpaceRole {
  return userAppSpaceRoles.includes(role as UserAppSpaceRole);
}

export function getUserAppRolePath(role: UserAppSpaceRole) {
  if (role === "local_transporter") {
    return "/transporter";
  }

  if (role === "traveler") {
    return "/traveler";
  }

  return "/client";
}

export function getUserAppSpaces(roles: readonly PlatformRole[]) {
  return roles
    .filter(isUserAppSpaceRole)
    .map((role) => ({
      href: getUserAppRolePath(role),
      label:
        role === "local_transporter"
          ? "Espace livreur"
          : role === "traveler"
            ? "Espace voyageur"
            : "Espace client",
      role,
    }));
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
