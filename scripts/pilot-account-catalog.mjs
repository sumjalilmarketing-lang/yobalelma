export const pilotApplications = {
  user: { label: "User App", signInUrl: "https://yobalelma-user.vercel.app/auth/login" },
  hub: { label: "Hub App", signInUrl: "https://yobalelma-hub.vercel.app/auth/sign-in" },
  relay: { label: "Relay App", signInUrl: "https://yobalelma-relay.vercel.app/auth/sign-in" },
  collection: { label: "Collection App", signInUrl: "https://yobalelma-collection.vercel.app/auth/sign-in" },
  admin: { label: "Admin App", signInUrl: "https://yobalelma-admin.vercel.app/auth/sign-in" },
};

export const pilotAccounts = [
  account("user", "client", "pilot.client@yobalelma.test", "Aminata Client"),
  account("user", "traveler", "pilot.traveler@yobalelma.test", "Moussa Voyageur"),
  account("user", "local_transporter", "pilot.transporter@yobalelma.test", "Fatou Livreur"),
  account("user", "client", "pilot.multirole@yobalelma.test", "Awa Multirôle", ["client", "traveler", "local_transporter"]),
  account("hub", "hub_agent", "pilot.hub-agent@yobalelma.test", "Awa Diop"),
  account("hub", "hub_supervisor", "pilot.hub-supervisor@yobalelma.test", "Moussa Ndiaye"),
  account("hub", "hub_manager", "pilot.hub-manager@yobalelma.test", "Fatou Sarr"),
  account("hub", "operations_manager", "pilot.operations-manager@yobalelma.test", "Responsable Opérations Hub", undefined, "Contrôle transverse", false),
  account("hub", "client", "pilot.hub-denied@yobalelma.test", "Accès Hub refusé", undefined, "Compte de contrôle négatif", false),
  account("relay", "relay_agent", "pilot.relay-agent@yobalelma.test", "Aminata Cissé"),
  account("relay", "operations_manager", "pilot.relay-supervisor@yobalelma.test", "Awa Fall", undefined, "Supervision Relay (operations_manager)"),
  account("relay", "relay_manager", "pilot.relay-manager@yobalelma.test", "Mamadou Diop"),
  account("relay", "client", "pilot.relay-denied@yobalelma.test", "Accès Relay refusé", undefined, "Compte de contrôle négatif", false),
  account("collection", "collection_driver", "pilot.collection-driver@yobalelma.test", "Ibrahima Diagne"),
  account("collection", "collection_supervisor", "pilot.collection-supervisor@yobalelma.test", "Awa Fall"),
  account("collection", "collection_manager", "pilot.collection-manager@yobalelma.test", "Fatou Ndiaye"),
  account("collection", "client", "pilot.collection-denied@yobalelma.test", "Accès Collection refusé", undefined, "Compte de contrôle négatif", false),
  ...[
    ["super_admin", "pilot.command@yobalelma.test", "Awa Ndiaye"],
    ["admin", "pilot.admin@yobalelma.test", "Mame Diop"],
    ["operations_manager", "pilot.operations@yobalelma.test", "Moussa Fall"],
    ["hub_manager", "pilot.admin-hub@yobalelma.test", "Aminata Ba"],
    ["relay_manager", "pilot.admin-relay@yobalelma.test", "Ousmane Sow"],
    ["collection_manager", "pilot.admin-collection@yobalelma.test", "Khady Kane"],
    ["local_delivery_manager", "pilot.local-delivery@yobalelma.test", "Ibrahima Faye"],
    ["traveler_manager", "pilot.travelers@yobalelma.test", "Fatou Sarr"],
    ["customs_manager", "pilot.customs@yobalelma.test", "Mamadou Ba"],
    ["compliance_manager", "pilot.compliance@yobalelma.test", "Ibrahima Ba"],
    ["finance_manager", "pilot.finance@yobalelma.test", "Mariama Diallo"],
    ["customer_support_manager", "pilot.support@yobalelma.test", "Khady Diop"],
    ["security_manager", "pilot.security@yobalelma.test", "Ousmane Kane"],
    ["auditor", "pilot.auditor@yobalelma.test", "Sokhna Fall"],
    ["country_manager", "pilot.country-sn@yobalelma.test", "Alioune Ndiaye"],
  ].map(([role, email, name]) => account("admin", role, email, name)),
];

function account(application, role, email, name, roles = [role], note, deliver = true) {
  return { application, deliver, email, name, note, role, roles };
}
