export const hubAppManifest = {
  domain: "hub.yobalelma.com",
  id: "hub-app",
  ownedRoutePrefixes: ["/hub", "/api/hub", "/api/qr"],
  roles: ["hub_agent", "hub_supervisor", "hub_manager", "operations_manager"],
  status: "active",
} as const;
