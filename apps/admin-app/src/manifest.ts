export const adminAppManifest = {
  domain: "admin.yobalelma.com",
  id: "admin-app",
  ownedRoutePrefixes: ["/command", "/api/admin"],
  roles: [
    "super_admin", "admin", "operations_manager", "hub_manager", "hub_supervisor", "hub_agent", "relay_manager", "relay_agent",
    "collection_manager", "collection_supervisor", "collection_driver", "dispatch_manager", "local_delivery_manager", "traveler_manager",
    "traveler_validation", "traveler_support", "customs_manager", "customs_agent", "compliance_manager", "compliance_agent", "finance_manager",
    "finance_agent", "accounting_agent", "reconciliation_agent", "payment_agent", "commission_agent", "refund_agent", "customer_support_manager",
    "customer_support_agent", "support_agent", "security_manager", "auditor", "partner_manager", "orange_partner_manager", "relay_partner_manager",
    "carrier_partner_manager", "airline_partner_manager",
  ],
  status: "active",
} as const;
