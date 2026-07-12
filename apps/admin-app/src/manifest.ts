export const adminAppManifest = {
  domain: "admin.yobalelma.com",
  id: "admin-app",
  ownedRoutePrefixes: [
    "/dashboard/admin",
    "/dashboard/operations",
    "/dashboard/support",
    "/api/commissions",
    "/api/disputes",
    "/api/notifications",
    "/api/support",
  ],
  roles: ["operations_manager", "support_agent", "finance_agent", "admin", "super_admin"],
  status: "planned",
} as const;
