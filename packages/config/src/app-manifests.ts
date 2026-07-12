export const yobalelmaApps = [
  {
    id: "user-app",
    name: "User App",
    domain: "app.yobalelma.com",
    routePrefixes: [
      "/",
      "/envoyer",
      "/livreur",
      "/voyager",
      "/suivi",
      "/support",
      "/auth",
      "/dashboard/client",
      "/dashboard/transporter",
      "/dashboard/traveler",
      "/api/auth",
      "/api/profile",
      "/api/shipments",
      "/api/parcel-requests",
      "/api/transporters",
      "/api/trips",
      "/api/travel-documents",
    ],
    roles: ["client", "local_transporter", "traveler"],
  },
  {
    id: "hub-app",
    name: "Hub App",
    domain: "hub.yobalelma.com",
    routePrefixes: ["/dashboard/hub", "/api/hub", "/api/qr"],
    roles: ["hub_agent", "hub_manager"],
  },
  {
    id: "collection-app",
    name: "Collection App",
    domain: "collecte.yobalelma.com",
    routePrefixes: ["/dashboard/collection", "/api/collection"],
    roles: ["collection_driver", "collection_manager"],
  },
  {
    id: "relay-app",
    name: "Relay App",
    domain: "relais.yobalelma.com",
    routePrefixes: ["/dashboard/relay", "/api/relay"],
    roles: ["relay_agent", "relay_manager"],
  },
  {
    id: "admin-app",
    name: "Admin App",
    domain: "admin.yobalelma.com",
    routePrefixes: [
      "/dashboard/admin",
      "/dashboard/operations",
      "/dashboard/support",
      "/api/commissions",
      "/api/disputes",
      "/api/notifications",
      "/api/support",
    ],
    roles: ["operations_manager", "support_agent", "finance_agent", "admin", "super_admin"],
  },
] as const;

export type YobalelmaAppId = (typeof yobalelmaApps)[number]["id"];
export type YobalelmaAppManifest = (typeof yobalelmaApps)[number];

export const legacyHostStatus = {
  description:
    "The root Next.js app remains the validated host while routes are migrated into independent applications.",
  host: "root-next-app",
  status: "transition",
} as const;

export function appManifestById(appId: YobalelmaAppId) {
  return yobalelmaApps.find((app) => app.id === appId);
}
