export const userAppManifest = {
  domain: "app.yobalelma.com",
  id: "user-app",
  ownedRoutePrefixes: [
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
  ],
  roles: ["client", "local_transporter", "traveler"],
  status: "planned",
} as const;
