export const relayAppManifest = {
  domain: "relais.yobalelma.com",
  id: "relay-app",
  ownedRoutePrefixes: ["/dashboard/relay", "/api/relay"],
  roles: ["relay_agent", "relay_manager"],
  status: "planned",
} as const;
