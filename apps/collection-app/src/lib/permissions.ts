import type { CollectionNavigationItem, CollectionPermission, CollectionRole } from "./types";

export const collectionNavigation: CollectionNavigationItem[] = [
  { href: "/collection", label: "Tableau de bord", permission: "collection:read", group: "missions" },
  { href: "/collection/missions", label: "Missions", permission: "collection:read", group: "missions" },
  { href: "/collection/assignment", label: "Affectation IA", permission: "collection:manage", group: "missions" },
  { href: "/collection/route-optimization", label: "Optimisation tournées", permission: "collection:read", group: "missions" },
  { href: "/collection/map", label: "GPS temps réel", permission: "collection:read", group: "missions" },
  { href: "/collection/navigation", label: "Navigation", permission: "collection:read", group: "missions" },
  { href: "/collection/scanner", label: "Scan QR & codes-barres", permission: "collection:write", group: "operations" },
  { href: "/collection/loading", label: "Chargement", permission: "collection:write", group: "operations" },
  { href: "/collection/unloading", label: "Déchargement", permission: "collection:write", group: "operations" },
  { href: "/collection/quantities", label: "Validation quantités", permission: "collection:write", group: "operations" },
  { href: "/collection/batches", label: "Contrôle des lots", permission: "collection:write", group: "operations" },
  { href: "/collection/inventory", label: "Inventaire camion", permission: "collection:read", group: "operations" },
  { href: "/collection/photos", label: "Photos colis", permission: "collection:write", group: "operations" },
  { href: "/collection/signatures", label: "Signatures", permission: "collection:write", group: "operations" },
  { href: "/collection/history", label: "Historique", permission: "collection:audit", group: "operations" },
  { href: "/collection/incidents", label: "Incidents", permission: "collection:write", group: "operations" },
  { href: "/collection/anomalies", label: "Anomalies IA", permission: "collection:write", group: "operations" },
  { href: "/collection/notifications", label: "Notifications", permission: "collection:read", group: "account" },
  { href: "/collection/messages", label: "Messagerie", permission: "collection:read", group: "account" },
  { href: "/collection/planning", label: "Planning", permission: "collection:read", group: "missions" },
  { href: "/collection/vehicle", label: "État du véhicule", permission: "collection:write", group: "fleet" },
  { href: "/collection/maintenance", label: "Maintenance", permission: "collection:read", group: "fleet" },
  { href: "/collection/mileage", label: "Kilométrage", permission: "collection:write", group: "fleet" },
  { href: "/collection/fuel", label: "Carburant", permission: "collection:write", group: "fleet" },
  { href: "/collection/driver-documents", label: "Documents chauffeur", permission: "collection:read", group: "fleet" },
  { href: "/collection/vehicle-documents", label: "Documents véhicule", permission: "collection:read", group: "fleet" },
  { href: "/collection/offline", label: "Mode hors ligne", permission: "collection:read", group: "account" },
  { href: "/collection/sync", label: "Synchronisation", permission: "collection:read", group: "account" },
  { href: "/collection/support", label: "Support", permission: "collection:read", group: "account" },
  { href: "/collection/profile", label: "Profil", permission: "collection:read", group: "account" },
  { href: "/collection/settings", label: "Paramètres", permission: "collection:manage", group: "account" },
];

const grants: Record<CollectionRole, CollectionPermission[]> = {
  collection_driver: ["collection:read", "collection:write", "collection:audit"],
  collection_supervisor: ["collection:read", "collection:write", "collection:manage", "collection:audit"],
  collection_manager: ["collection:read", "collection:write", "collection:manage", "collection:audit"],
  operations_manager: ["collection:read", "collection:write", "collection:manage", "collection:audit"],
};
export function hasCollectionPermission(role: CollectionRole, permission: CollectionPermission) { return grants[role].includes(permission); }
export function canAccessCollectionNavigation(role: CollectionRole, item: CollectionNavigationItem) { return hasCollectionPermission(role, item.permission); }
export function canUseCollectionRoute(role: CollectionRole, pathname: string, method = "GET") {
  if (pathname.startsWith("/api/collection/test")) return process.env.NODE_ENV !== "production";
  if (pathname.includes("/settings") || pathname.includes("/assignment")) return hasCollectionPermission(role, "collection:manage");
  if (pathname.includes("/history") || pathname.includes("/audit")) return hasCollectionPermission(role, "collection:audit");
  return hasCollectionPermission(role, method === "GET" ? "collection:read" : "collection:write");
}
export function assertCollectionAccess(role: CollectionRole, pathname: string, method = "GET") {
  if (!canUseCollectionRoute(role, pathname, method)) throw new Error("Accès Collection refusé.");
}
