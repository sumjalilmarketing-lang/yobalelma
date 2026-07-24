export const collectionAppManifest = {
  domain: "collecte.yobalelma.com",
  id: "collection-app",
  ownedRoutePrefixes: ["/collection", "/api/collection"],
  roles: ["collection_driver", "collection_supervisor", "collection_manager", "operations_manager"],
  status: "production",
} as const;
