import type { RelayNavigationItem, RelayPermission, RelayRole } from "./types";

export const relayNavigation: RelayNavigationItem[] = [
  { href: "/relay", label: "Tableau de bord", permission: "relay:read", group: "reception" },
  { href: "/relay/reception", label: "Réception colis", permission: "relay:write", group: "reception" },
  { href: "/relay/quality", label: "Contrôle qualité", permission: "relay:write", group: "reception" },
  { href: "/relay/scanner", label: "Scan QR & codes-barres", permission: "relay:write", group: "reception" },
  { href: "/relay/weighing", label: "Pesée", permission: "relay:write", group: "reception" },
  { href: "/relay/dimensions", label: "Dimensions", permission: "relay:write", group: "reception" },
  { href: "/relay/photos", label: "Photos colis", permission: "relay:write", group: "reception" },
  { href: "/relay/inventory", label: "Inventaire", permission: "relay:read", group: "inventory" },
  { href: "/relay/storage", label: "Stockage intelligent", permission: "relay:write", group: "inventory" },
  { href: "/relay/locations", label: "Emplacements", permission: "relay:read", group: "inventory" },
  { href: "/relay/shelves", label: "Rayonnages", permission: "relay:manage", group: "inventory" },
  { href: "/relay/lockers", label: "Casiers", permission: "relay:manage", group: "inventory" },
  { href: "/relay/carrier-handover", label: "Remise transporteur", permission: "relay:write", group: "handover" },
  { href: "/relay/recipient-handover", label: "Remise destinataire", permission: "relay:write", group: "handover" },
  { href: "/relay/otp", label: "Validation OTP", permission: "relay:write", group: "handover" },
  { href: "/relay/signatures", label: "Signature électronique", permission: "relay:write", group: "handover" },
  { href: "/relay/labels", label: "Impression étiquettes", permission: "relay:write", group: "handover" },
  { href: "/relay/receipts", label: "Impression reçus", permission: "relay:write", group: "handover" },
  { href: "/relay/history", label: "Historique", permission: "relay:audit", group: "handover" },
  { href: "/relay/search", label: "Recherche", permission: "relay:read", group: "handover" },
  { href: "/relay/incidents", label: "Incidents", permission: "relay:write", group: "account" },
  { href: "/relay/anomalies", label: "Anomalies IA", permission: "relay:read", group: "account" },
  { href: "/relay/refused", label: "Colis refusés", permission: "relay:read", group: "account" },
  { href: "/relay/pending", label: "Colis en attente", permission: "relay:read", group: "account" },
  { href: "/relay/notifications", label: "Notifications", permission: "relay:read", group: "account" },
  { href: "/relay/offline", label: "Mode hors ligne", permission: "relay:read", group: "account" },
  { href: "/relay/sync", label: "Synchronisation", permission: "relay:read", group: "account" },
  { href: "/relay/support", label: "Support", permission: "relay:read", group: "account" },
  { href: "/relay/profile", label: "Profil", permission: "relay:read", group: "account" },
  { href: "/relay/settings", label: "Paramètres", permission: "relay:manage", group: "account" },
];

const grants: Record<RelayRole, RelayPermission[]> = {
  relay_agent: ["relay:read", "relay:write", "relay:audit"],
  relay_manager: ["relay:read", "relay:write", "relay:manage", "relay:audit"],
  operations_manager: ["relay:read", "relay:write", "relay:manage", "relay:audit"],
};

export function hasRelayPermission(role: RelayRole, permission: RelayPermission) { return grants[role].includes(permission); }
export function canAccessRelayNavigation(role: RelayRole, item: RelayNavigationItem) { return hasRelayPermission(role, item.permission); }
export function canUseRelayRoute(role: RelayRole, pathname: string, method = "GET") {
  if (pathname.startsWith("/api/relay/test")) return process.env.NODE_ENV !== "production";
  if (pathname.includes("/settings") || pathname.includes("/shelves") || pathname.includes("/lockers")) return hasRelayPermission(role, "relay:manage");
  if (pathname.includes("/history") || pathname.includes("/audit")) return hasRelayPermission(role, "relay:audit");
  return hasRelayPermission(role, method === "GET" ? "relay:read" : "relay:write");
}
export function assertRelayAccess(role: RelayRole, pathname: string, method = "GET") {
  if (!canUseRelayRoute(role, pathname, method)) throw new Error("Accès Relay refusé.");
}
