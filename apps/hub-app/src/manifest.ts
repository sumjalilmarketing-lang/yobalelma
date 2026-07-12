export const hubAppManifest = {
  domain: "hub.yobalelma.com",
  id: "hub-app",
  ownedRoutePrefixes: ["/dashboard/hub", "/api/hub", "/api/qr"],
  roles: ["hub_agent", "hub_manager"],
  status: "planned",
} as const;
