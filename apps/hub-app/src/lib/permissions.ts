import type { HubNavigationItem, HubPermission, HubRole } from "./types";

export const hubRoles: HubRole[] = [
  "hub_agent",
  "hub_supervisor",
  "hub_manager",
  "operations_manager",
];

export const hubNavigation: HubNavigationItem[] = [
  { href: "/hub", labelKey: "dashboard", permission: "hub:read" },
  { href: "/hub/inbound", labelKey: "inbound", permission: "hub:write" },
  { href: "/hub/scanner", labelKey: "scanner", permission: "hub:write" },
  { href: "/hub/inspection", labelKey: "inspection", permission: "hub:write" },
  { href: "/hub/inventory", labelKey: "inventory", permission: "hub:read" },
  { href: "/hub/storage", labelKey: "storage", permission: "hub:write" },
  { href: "/hub/trips", labelKey: "trips", permission: "hub:read" },
  { href: "/hub/capacities", labelKey: "capacities", permission: "hub:read" },
  { href: "/hub/batches", labelKey: "batches", permission: "hub:write" },
  { href: "/hub/handover", labelKey: "handover", permission: "hub:handover" },
  { href: "/hub/anomalies", labelKey: "anomalies", permission: "hub:write" },
  { href: "/hub/history", labelKey: "history", permission: "hub:supervise" },
  { href: "/hub/reports", labelKey: "reports", permission: "hub:reports" },
  { href: "/hub/notifications", labelKey: "notifications", permission: "hub:read" },
  { href: "/hub/profile", labelKey: "profile", permission: "hub:read" },
  { href: "/hub/settings", labelKey: "settings", permission: "hub:settings" },
];

const rolePermissions: Record<HubRole, HubPermission[]> = {
  hub_agent: ["hub:read", "hub:write", "hub:handover"],
  hub_supervisor: ["hub:read", "hub:write", "hub:supervise", "hub:handover", "hub:reports"],
  hub_manager: [
    "hub:read",
    "hub:write",
    "hub:supervise",
    "hub:manage",
    "hub:handover",
    "hub:settings",
    "hub:reports",
  ],
  operations_manager: ["hub:read", "hub:write", "hub:supervise", "hub:handover", "hub:reports"],
};

export function roleHasHubPermission(role: HubRole, permission: HubPermission) {
  return rolePermissions[role]?.includes(permission) ?? false;
}

export function canAccessHubNavigation(role: HubRole, item: HubNavigationItem) {
  return roleHasHubPermission(role, item.permission);
}

export function canWriteHub(role: HubRole) {
  return roleHasHubPermission(role, "hub:write");
}

export function canUseHubRoute(role: HubRole, pathname: string, method = "GET") {
  if (pathname.startsWith("/api/hub/test")) {
    return process.env.NODE_ENV !== "production";
  }

  if (pathname.includes("/settings")) {
    return roleHasHubPermission(role, "hub:settings");
  }

  if (pathname.includes("/history") || pathname.includes("/reports")) {
    return roleHasHubPermission(role, "hub:supervise") || roleHasHubPermission(role, "hub:reports");
  }

  if (pathname.includes("/handover")) {
    return roleHasHubPermission(role, "hub:handover");
  }

  return roleHasHubPermission(role, method === "GET" ? "hub:read" : "hub:write");
}

export function assertHubRouteAccess(role: HubRole, pathname: string, method = "GET") {
  if (!canUseHubRoute(role, pathname, method)) {
    throw new Error("Access denied for this Hub operation.");
  }
}
