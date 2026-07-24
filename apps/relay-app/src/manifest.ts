export const relayAppManifest = {
  domain: "relais.yobalelma.com",
  id: "relay-app",
  ownedRoutePrefixes: ["/relay", "/api/relay"],
  roles: ["relay_agent", "relay_manager", "operations_manager"],
  status: "production",
} as const;
