import type {
  OperationalWorkspaceConfig,
  WorkspaceMetric,
} from "@/components/dashboard/operational-workspace";

export const workspaceConfigs = {
  "client/tracking": {
    allowedRoles: ["client"],
    actions: [
      { href: "/dashboard/client/shipments", label: "Mes expéditions", permission: "shipment:read" },
      { href: "/dashboard/client/support", label: "Ouvrir un ticket", permission: "support:write" },
    ],
    checkpoints: [
      "Un code de suivi unique accompagne chaque envoi.",
      "Chaque étape du trajet reste consultable dans ton espace.",
      "Les preuves de livraison sont réunies avec le colis concerné.",
    ],
    description: "Suivi privé de tes expéditions, de leurs étapes et de leurs preuves de livraison.",
    emptyTitle: "Suivi de mes colis",
    eyebrow: "Client",
    metrics: [
      { label: "Expéditions", table: "shipments", userColumn: "sender_id" },
      { label: "Événements", table: "shipment_status_events" },
      { label: "Preuves", table: "delivery_proofs" },
    ],
    permission: "shipment:track",
    scene: "client",
    title: "Suivi de mes colis",
  },
  "client/payments": {
    allowedRoles: ["client"],
    actions: [
      { href: "/dashboard/client/shipments/new", label: "Nouvelle expédition", permission: "shipment:write" },
      { href: "/dashboard/client/support", label: "Support paiement", permission: "support:write" },
    ],
    checkpoints: [
      "Chaque règlement est rattaché à l’expédition concernée.",
      "Les frais et la devise sont présentés avant confirmation.",
      "L’assistance Yobalelma accompagne toute contestation de paiement.",
    ],
    description: "Consulte tes règlements, les frais appliqués et l’historique de tes transactions.",
    emptyTitle: "Mes paiements",
    eyebrow: "Client",
    metrics: [
      { label: "Paiements", table: "payment_intents", userColumn: "payer_id" },
      { label: "Expéditions payables", table: "shipments", userColumn: "sender_id" },
      { label: "Litiges", table: "shipment_disputes", userColumn: "opened_by" },
    ],
    permission: "payment:read",
    scene: "client",
    title: "Paiements",
  },
  "client/messages": {
    allowedRoles: ["client"],
    actions: [
      { href: "/dashboard/client/support", label: "Tickets support", permission: "support:read" },
      { href: "/support", label: "Contact public", permission: "support:write" },
    ],
    checkpoints: [
      "Chaque demande reste liée à ton compte.",
      "Tes échanges sont conservés dans une conversation unique.",
      "Un conseiller Yobalelma peut reprendre les demandes prioritaires.",
    ],
    description: "Messages et conversations liés à tes expéditions.",
    emptyTitle: "Messagerie support",
    eyebrow: "Client",
    metrics: [
      { label: "Tickets", table: "support_tickets", userColumn: "requester_id" },
      { label: "Messages", table: "support_messages", userColumn: "author_id" },
      { label: "Notifications", table: "notifications", userColumn: "recipient_id" },
    ],
    permission: "support:read",
    scene: "support",
    title: "Messages",
  },
  "client/support": {
    allowedRoles: ["client"],
    actions: [
      { href: "/support", label: "Nouveau ticket", permission: "support:write" },
      { href: "/dashboard/client/messages", label: "Messages", permission: "support:read" },
    ],
    checkpoints: [
      "Une demande peut être ouverte depuis ton espace personnel.",
      "La catégorie et la priorité facilitent son traitement.",
      "Tu peux suivre l’avancement jusqu’à la résolution.",
    ],
    description: "Tickets, litiges et assistance client.",
    emptyTitle: "Support client",
    eyebrow: "Client",
    metrics: [
      { label: "Tickets ouverts", table: "support_tickets", userColumn: "requester_id", filter: { column: "status", value: "open" } },
      { label: "Litiges", table: "shipment_disputes", userColumn: "opened_by" },
      { label: "Messages", table: "support_messages", userColumn: "author_id" },
    ],
    permission: "support:read",
    scene: "support",
    title: "Support",
  },
  "client/addresses": {
    allowedRoles: ["client"],
    actions: [
      { href: "/dashboard/client/shipments/new", label: "Utiliser une adresse", permission: "shipment:write" },
      { href: "/dashboard/client/profile", label: "Profil", permission: "client:write" },
    ],
    checkpoints: [
      "Les coordonnées de départ et d’arrivée restent liées à chaque expédition.",
      "Ton adresse principale peut être réutilisée depuis ton profil.",
      "Vérifie toujours les coordonnées avant de confirmer un envoi.",
    ],
    description: "Retrouve les adresses utilisées pour tes expéditions.",
    emptyTitle: "Adresses",
    eyebrow: "Client",
    metrics: [
      { label: "Adresses d’expédition", table: "shipment_addresses" },
      { label: "Expéditions", table: "shipments", userColumn: "sender_id" },
    ],
    permission: "client:read",
    scene: "client",
    title: "Adresses",
  },
  "client/profile": {
    allowedRoles: ["client"],
    actions: [
      { href: "/dashboard/client/kyc", label: "Vérifier mon identité", permission: "client:write" },
      { href: "/dashboard/client/notifications", label: "Notifications", permission: "client:read" },
    ],
    checkpoints: [
      "Ton profil est créé avec ton compte Yobalelma.",
      "Tes coordonnées peuvent être mises à jour à tout moment.",
      "Ta photo aide les équipes à reconnaître ton dossier.",
    ],
    description: "Gère ton identité, tes coordonnées et les informations de ton compte.",
    emptyTitle: "Profil client",
    eyebrow: "Client",
    metrics: [
      { label: "Profil", table: "profiles", filter: { column: "primary_role", value: "client" } },
      { label: "Identité vérifiée", table: "identity_verifications", userColumn: "profile_id" },
    ],
    permission: "client:read",
    scene: "client",
    title: "Profil",
  },
  "client/notifications": {
    allowedRoles: ["client"],
    actions: [
      { href: "/dashboard/client/shipments", label: "Expéditions", permission: "shipment:read" },
      { href: "/dashboard/client/support", label: "Support", permission: "support:read" },
    ],
    checkpoints: [
      "Les alertes importantes apparaissent dans ton espace.",
      "Chaque notification peut être marquée comme lue.",
      "Les communications urgentes peuvent aussi être envoyées par e-mail ou message.",
    ],
    description: "Retrouve les alertes liées à tes colis, paiements et demandes d’assistance.",
    emptyTitle: "Notifications",
    eyebrow: "Client",
    metrics: [
      { label: "Notifications", table: "notifications", userColumn: "recipient_id" },
      { label: "Non lues", table: "notifications", userColumn: "recipient_id", filter: { column: "status", value: "sent" } },
    ],
    permission: "client:read",
    scene: "client",
    title: "Notifications",
  },

  "transporter/earnings": {
    allowedRoles: ["local_transporter"],
    actions: [
      { href: "/dashboard/transporter/missions", label: "Missions", permission: "mission:read" },
      { href: "/dashboard/transporter/support", label: "Support gains", permission: "support:write" },
    ],
    checkpoints: [
      "Chaque rémunération est rattachée à la mission correspondante.",
      "Un incident de remise suspend le versement jusqu’à vérification.",
      "Le détail des gains reste consultable depuis ton espace.",
    ],
    description: "Consulte les gains associés à tes missions de livraison.",
    emptyTitle: "Gains livreur",
    eyebrow: "Livreur",
    metrics: [
      { label: "Versements", table: "payouts", userColumn: "beneficiary_id" },
      { label: "Missions livrees", table: "local_delivery_missions", userColumn: "transporter_id", filter: { column: "status", value: "delivered" } },
    ],
    permission: "payout:read",
    scene: "transporter",
    title: "Gains",
  },
  "transporter/kyc": {
    allowedRoles: ["local_transporter"],
    actions: [
      { href: "/dashboard/kyc", label: "Vérifier mon identité", permission: "transporter:write" },
      { href: "/dashboard/transporter/profile", label: "Profil", permission: "transporter:read" },
    ],
    checkpoints: [
      "Ton identité doit être confirmée avant l’activation.",
      "Tes documents restent protégés et accessibles uniquement aux équipes autorisées.",
      "Yobalelma t’informe dès que la vérification est terminée.",
    ],
    description: "Vérification de ton identité et suivi de l’activation de ton profil livreur.",
    emptyTitle: "Vérification d’identité",
    eyebrow: "Livreur",
    metrics: [
      { label: "Vérifications", table: "identity_verifications", userColumn: "profile_id" },
      { label: "Documents", table: "identity_verification_documents", userColumn: "profile_id" },
    ],
    permission: "transporter:read",
    scene: "transporter",
    title: "Vérification d’identité",
  },
  "transporter/ratings": {
    allowedRoles: ["local_transporter"],
    actions: [
      { href: "/dashboard/transporter/missions/history", label: "Historique", permission: "mission:read" },
    ],
    checkpoints: [
      "Ta note reflète la qualité de tes livraisons.",
      "Les missions terminées alimentent ton historique.",
      "Une prestation régulière améliore la confiance des clients.",
    ],
    description: "Note, historique et qualite de service livreur.",
    emptyTitle: "Evaluations",
    eyebrow: "Livreur",
    metrics: [
      { label: "Profil transporteur", table: "transporter_profiles", userColumn: "profile_id" },
      { label: "Missions livrees", table: "local_delivery_missions", userColumn: "transporter_id", filter: { column: "status", value: "delivered" } },
    ],
    permission: "transporter:read",
    scene: "transporter",
    title: "Evaluations",
  },
  "transporter/support": {
    allowedRoles: ["local_transporter"],
    actions: [
      { href: "/support", label: "Nouveau ticket", permission: "support:write" },
      { href: "/dashboard/transporter/missions", label: "Missions", permission: "mission:read" },
    ],
    checkpoints: [
      "Chaque demande reste liée à ton profil livreur.",
      "Tes échanges sont regroupés dans une conversation claire.",
      "Les situations urgentes sont transmises à l’équipe opérationnelle.",
    ],
    description: "Assistance transporteur local.",
    emptyTitle: "Support livreur",
    eyebrow: "Livreur",
    metrics: [
      { label: "Tickets", table: "support_tickets", userColumn: "requester_id" },
      { label: "Messages", table: "support_messages", userColumn: "author_id" },
    ],
    permission: "support:read",
    scene: "support",
    title: "Support",
  },
  "transporter/profile": {
    allowedRoles: ["local_transporter"],
    actions: [
      { href: "/dashboard/transporter/vehicle", label: "Vehicule", permission: "transporter:write" },
      { href: "/dashboard/transporter/zones", label: "Zones", permission: "transporter:write" },
    ],
    checkpoints: [
      "Ton profil rassemble les informations utiles à tes missions.",
      "Ton véhicule et tes zones d’intervention sont gérés séparément.",
      "Ta disponibilité peut être ajustée selon ton planning.",
    ],
    description: "Profil operationnel du livreur local.",
    emptyTitle: "Profil livreur",
    eyebrow: "Livreur",
    metrics: [
      { label: "Profil", table: "transporter_profiles", userColumn: "profile_id" },
      { label: "Vehicules", table: "transporter_vehicles", userColumn: "profile_id" },
      { label: "Zones", table: "transporter_zones", userColumn: "profile_id" },
    ],
    permission: "transporter:read",
    scene: "transporter",
    title: "Profil",
  },
  "transporter/notifications": {
    allowedRoles: ["local_transporter"],
    actions: [
      { href: "/dashboard/transporter/missions/available", label: "Missions disponibles", permission: "mission:read" },
    ],
    checkpoints: [
      "Les nouvelles missions apparaissent dans ton espace.",
      "Les changements importants peuvent aussi être envoyés par message.",
      "Tu peux distinguer facilement les alertes lues et non lues.",
    ],
    description: "Alertes mission, support et gains.",
    emptyTitle: "Notifications livreur",
    eyebrow: "Livreur",
    metrics: [
      { label: "Notifications", table: "notifications", userColumn: "recipient_id" },
      { label: "Missions offertes", table: "local_delivery_missions", userColumn: "transporter_id", filter: { column: "status", value: "offered" } },
    ],
    permission: "transporter:read",
    scene: "transporter",
    title: "Notifications",
  },
} satisfies Record<string, OperationalWorkspaceConfig>;

const extensionConfigs = {
  "relay/dropoff": relayConfig("Depot relais", "Reception client au relais.", "relay:write"),
  "relay/collections": relayConfig("Collectes", "Preparation des remises au chauffeur collecte.", "relay:read"),
  "relay/destination-reception": relayConfig("Reception destination", "Reception des lots et colis au relais destination.", "relay:write"),
  "relay/anomalies": relayConfig("Anomalies relais", "Exceptions, refus, colis endommages ou manquants.", "relay:write"),
  "relay/history": relayConfig("Historique relais", "Journal des scans et mouvements relais.", "relay:read"),
  "relay/profile": relayConfig("Profil relais", "Coordonnees, capacite et statut du point relais.", "relay:read"),
  "relay/notifications": relayConfig("Notifications relais", "Alertes relais et collecte.", "relay:read"),
  "collection/stops": collectionConfig("Arrets", "Arrets de tournee et relais assignes.", "collection:read"),
  "collection/vehicle": collectionConfig("Vehicule collecte", "Vehicule et capacite chauffeur collecte.", "collection:write"),
  "collection/incidents": collectionConfig("Incidents collecte", "Incidents de chargement, route ou remise hub.", "collection:write"),
  "collection/history": collectionConfig("Historique collecte", "Tournées et manifestes termines.", "collection:read"),
  "collection/profile": collectionConfig("Profil collecte", "Profil chauffeur collecte distinct du livreur local.", "collection:read"),
  "collection/notifications": collectionConfig("Notifications collecte", "Alertes route et hub.", "collection:read"),
  "traveler/tickets": travelerConfig("Billets", "Billets d’avion transmis et suivi de leur vérification.", "traveler:read"),
  "traveler/capacity": travelerConfig("Capacite", "Capacite disponible et reservations hub.", "traveler:read"),
  "traveler/assignments": travelerConfig("Assignations", "Lots et colis associes au voyageur.", "traveler:read"),
  "traveler/earnings": travelerConfig("Gains voyageur", "Rémunérations liées aux trajets et aux lots transportés.", "payout:read"),
  "traveler/payments": travelerConfig("Paiements voyageur", "Historique de remuneration et blocages.", "payout:read"),
  "traveler/history": travelerConfig("Historique voyageur", "Trajets, lots et remises passes.", "traveler:read"),
  "traveler/support": travelerConfig("Support voyageur", "Tickets voyageur et incidents.", "support:read"),
  "traveler/profile": travelerConfig("Profil voyageur", "Profil, vérification d’identité, passeport et informations utiles.", "traveler:read"),
  "traveler/notifications": travelerConfig("Notifications voyageur", "Alertes hub, QR et support.", "traveler:read"),
  "hub/storage": hubConfig("Stockage hub", "Emplacements, inspections et inventaire hub.", "hub:read"),
  "hub/inspection": hubConfig("Inspection hub", "Controle poids, dimensions, photos et decision.", "hub:write"),
  "hub/scanner": hubConfig("Scanner hub", "Scans QR, lots et remises voyageur.", "qr:write"),
  "hub/anomalies": hubConfig("Anomalies hub", "Colis manquants, endommages ou refuses.", "hub:write"),
  "hub/history": hubConfig("Historique hub", "Lots, reservations et inspections passees.", "hub:read"),
  "hub/reports": hubConfig("Rapports hub", "Volumes, poids, QR et anomalies consolides.", "hub:read"),
  "hub/profile": hubConfig("Profil hub", "Equipe, site, capacite et statut operationnel.", "hub:read"),
  "hub/notifications": hubConfig("Notifications hub", "Alertes collecte, voyageur et anomalies.", "hub:read"),
  "admin/users": adminConfig("Utilisateurs", "Recherche, profils, roles et historique utilisateur.", "admin:read", [
    { label: "Profils", table: "profiles" },
    { label: "KYC", table: "identity_verifications" },
    { label: "Audit", table: "audit_log_events" },
  ]),
  "admin/roles": adminConfig("Roles", "RBAC applicatif, attribution et audit des roles.", "admin:read", [
    { label: "Profils", table: "profiles" },
    { label: "Audit role", table: "audit_log_events", filter: { column: "entity_type", value: "user_role" } },
  ]),
  "admin/permissions": adminConfig("Permissions", "Permissions critiques reservees super admin.", "super_admin:write", [
    { label: "Audit permissions", table: "audit_log_events" },
    { label: "Admins", table: "profiles", filter: { column: "primary_role", value: "admin" } },
  ]),
  "admin/kyc": adminConfig("KYC", "Validation des identites, documents et refus justifies.", "kyc:review", [
    { label: "KYC", table: "identity_verifications" },
    { label: "Documents", table: "identity_verification_documents" },
  ]),
  "admin/transporters": adminConfig("Livreurs", "Livreurs locaux, vehicules, disponibilites et incidents.", "admin:read", [
    { label: "Livreurs", table: "transporter_profiles" },
    { label: "Missions", table: "local_delivery_missions" },
  ]),
  "admin/travelers": adminConfig("Voyageurs", "Voyageurs, billets, trajets et capacites.", "traveler:read", [
    { label: "Voyages", table: "trips" },
    { label: "Billets", table: "traveler_documents" },
    { label: "Lots", table: "hub_batches" },
  ]),
  "admin/collection-drivers": adminConfig("Chauffeurs collecte", "Collecte relais vers hub et manifestes.", "collection:read", [
    { label: "Tournees", table: "collection_routes" },
    { label: "Manifestes", table: "collection_manifests" },
  ]),
  "admin/relay-networks": adminConfig("Reseaux relais", "Partenaires relais configurables et performance.", "relay:read", [
    { label: "Points relais", table: "relay_points" },
    { label: "Inventaire relais", table: "relay_inventory" },
  ]),
  "admin/relay-points": adminConfig("Points relais", "Sites relais, capacites, horaires et scans.", "relay:read", [
    { label: "Points relais", table: "relay_points" },
    { label: "Scans", table: "relay_scan_events" },
  ]),
  "admin/hubs": adminConfig("Hubs", "Hubs, lots, capacites et flux internationaux.", "hub:read", [
    { label: "Lots hub", table: "hub_batches" },
    { label: "Reservations", table: "capacity_reservations" },
  ]),
  "admin/hub-users": adminConfig("Agents hub", "Affectation des agents hub et supervision.", "admin:read", [
    { label: "Agents potentiels", table: "profiles" },
    { label: "Audit", table: "audit_log_events" },
  ]),
  "admin/shipments": adminConfig("Expeditions", "Recherche globale, timeline, acteurs et corrections auditees.", "shipment:read", [
    { label: "Expeditions", table: "shipments" },
    { label: "Evenements", table: "shipment_status_events" },
  ]),
  "admin/dispatch": adminConfig("Dispatch", "Assignations et interventions operationnelles.", "dispatch:read", [
    { label: "Dispatch", table: "local_delivery_missions" },
    { label: "Missions", table: "local_delivery_missions" },
  ]),
  "admin/collections": adminConfig("Collectes", "Tournees, manifestes et handover hub.", "collection:read", [
    { label: "Tournees", table: "collection_routes" },
    { label: "Manifestes", table: "collection_manifests" },
  ]),
  "admin/trips": adminConfig("Voyages", "Trajets voyageurs, billets et disponibilite.", "traveler:read", [
    { label: "Voyages", table: "trips" },
    { label: "Billets", table: "traveler_documents" },
  ]),
  "admin/batches": adminConfig("Lots", "Lots hub, reservations et remise voyageur.", "hub:read", [
    { label: "Lots", table: "hub_batches" },
    { label: "Reservations", table: "capacity_reservations" },
  ]),
  "admin/inventory": adminConfig("Inventaire", "Inventaire relais et reservations hub disponibles.", "hub:read", [
    { label: "Relais", table: "relay_inventory" },
    { label: "Reservations", table: "capacity_reservations" },
  ]),
  "admin/anomalies": adminConfig("Anomalies", "Incidents, litiges et actions correctives.", "admin:read", [
    { label: "Litiges", table: "shipment_disputes" },
    { label: "Tickets", table: "support_tickets" },
  ]),
  "admin/payments": adminConfig("Paiements", "Paiements clients, rapprochement et litiges.", "payment:read", [
    { label: "Paiements", table: "payment_intents" },
    { label: "Litiges", table: "shipment_disputes" },
  ]),
  "admin/payouts": adminConfig("Payouts", "Payouts livreurs/voyageurs, blocages et liberation.", "payout:read", [
    { label: "Payouts", table: "payouts" },
    { label: "Commissions", table: "platform_commissions" },
  ]),
  "admin/disputes": adminConfig("Litiges", "Litiges, preuves et resolution support.", "support:read", [
    { label: "Litiges", table: "shipment_disputes" },
    { label: "Preuves", table: "delivery_proofs" },
  ]),
  "admin/support": adminConfig("Support", "Tickets, messages et SLA.", "support:read", [
    { label: "Tickets", table: "support_tickets" },
    { label: "Messages", table: "support_messages" },
  ]),
  "admin/audit": adminConfig("Audit", "Actions critiques, changements roles et corrections.", "admin:read", [
    { label: "Audit", table: "audit_log_events" },
    { label: "Evenements", table: "shipment_status_events" },
  ]),
  "admin/settings": adminConfig("Parametres", "Parametres globaux et seuils operationnels.", "super_admin:write", [
    { label: "Audit settings", table: "audit_log_events", filter: { column: "entity_type", value: "system_setting" } },
  ]),
  "admin/pricing": adminConfig("Tarification", "Regles tarifaires et commissions.", "payment:read", [
    { label: "Paiements", table: "payment_intents" },
    { label: "Commissions", table: "platform_commissions" },
  ]),
  "admin/notifications": adminConfig("Notifications", "Notifications in-app et canaux externes.", "admin:read", [
    { label: "Notifications", table: "notifications" },
  ]),
  "admin/analytics": adminConfig("Analytics", "KPI plateforme, pays et hubs.", "admin:read", [
    { label: "Expeditions", table: "shipments" },
    { label: "Paiements", table: "payment_intents" },
    { label: "Lots", table: "hub_batches" },
  ]),
  "admin/reports": adminConfig("Rapports", "Exports et rapports operationnels.", "admin:read", [
    { label: "Audit", table: "audit_log_events" },
    { label: "Expeditions", table: "shipments" },
  ]),
  "admin/integrations": adminConfig("Integrations", "Providers paiement, storage, email et SMS.", "super_admin:write", [
    { label: "Audit integrations", table: "audit_log_events" },
  ]),
  "admin/feature-flags": adminConfig("Feature flags", "Activation progressive des modules.", "super_admin:write", [
    { label: "Audit flags", table: "audit_log_events", filter: { column: "entity_type", value: "feature_flag" } },
  ]),
  "admin/system-health": adminConfig("Sante systeme", "Etat technique, erreurs et audit.", "admin:read", [
    { label: "Audit", table: "audit_log_events" },
    { label: "Notifications", table: "notifications" },
  ]),
  "operations/shipments": operationsConfig("Expeditions", "Supervision temps reel des expeditions.", [
    { label: "Expeditions", table: "shipments" },
    { label: "Evenements", table: "shipment_status_events" },
  ]),
  "operations/dispatch": operationsConfig("Dispatch", "Reassignations et priorisation terrain.", [
    { label: "Dispatch", table: "local_delivery_missions" },
    { label: "Missions", table: "local_delivery_missions" },
  ]),
  "operations/collections": operationsConfig("Collectes", "Tournees, retards et remises hub.", [
    { label: "Tournees", table: "collection_routes" },
    { label: "Manifestes", table: "collection_manifests" },
  ]),
  "operations/relays": operationsConfig("Relais", "Performance relais, scans et inventaires.", [
    { label: "Relais", table: "relay_points" },
    { label: "Inventaire", table: "relay_inventory" },
  ]),
  "operations/hubs": operationsConfig("Hubs", "Batches, capacite et handover.", [
    { label: "Lots", table: "hub_batches" },
    { label: "Reservations", table: "capacity_reservations" },
  ]),
  "operations/trips": operationsConfig("Voyages", "Voyageurs, billets et trajets.", [
    { label: "Voyages", table: "trips" },
    { label: "Billets", table: "traveler_documents" },
  ]),
  "operations/batches": operationsConfig("Lots", "Lots prepares, en transit et arrives.", [
    { label: "Lots", table: "hub_batches" },
    { label: "Reservations", table: "capacity_reservations" },
  ]),
  "operations/anomalies": operationsConfig("Anomalies", "Incidents, tickets et litiges a traiter.", [
    { label: "Tickets", table: "support_tickets" },
    { label: "Litiges", table: "shipment_disputes" },
  ], "operations:write"),
  "operations/performance": operationsConfig("Performance", "SLA, volumes et goulets d'etranglement.", [
    { label: "Expeditions", table: "shipments" },
    { label: "Livraisons", table: "delivery_proofs" },
    { label: "Payouts", table: "payouts" },
  ]),
  "operations/live-map": operationsConfig("Live map", "Vue terrain des flux et points actifs.", [
    { label: "Tournees", table: "collection_routes" },
    { label: "Relais", table: "relay_points" },
    { label: "Missions", table: "local_delivery_missions" },
  ]),
  "operations/notifications": operationsConfig("Notifications", "Alertes operations et escalades.", [
    { label: "Notifications", table: "notifications" },
    { label: "Tickets", table: "support_tickets" },
  ]),
} satisfies Record<string, OperationalWorkspaceConfig>;

Object.assign(workspaceConfigs, extensionConfigs);

export type WorkspaceKey = keyof typeof workspaceConfigs;

export function getWorkspaceConfig(key: string) {
  return workspaceConfigs[key as WorkspaceKey] ?? null;
}

function relayConfig(
  title: string,
  description: string,
  permission: OperationalWorkspaceConfig["permission"],
): OperationalWorkspaceConfig {
  return {
    allowedRoles: ["relay_agent", "relay_manager", "operations_manager", "admin", "super_admin"],
    actions: [
      { href: "/dashboard/relay/scanner", label: "Scanner", permission: "relay:write" },
      { href: "/dashboard/relay/inventory", label: "Inventaire", permission: "relay:read" },
      { href: "/dashboard/relay/outbound", label: "Sortie", permission: "relay:write" },
    ],
    checkpoints: ["Scan tracking.", "Controle visuel.", "Inventaire et historique."],
    description,
    eyebrow: "Relais",
    metrics: [
      { label: "Relais", table: "relay_points" },
      { label: "Inventaire", table: "relay_inventory" },
      { label: "Scans", table: "relay_scan_events" },
    ],
    permission,
    scene: "relay",
    title,
  };
}

function collectionConfig(
  title: string,
  description: string,
  permission: OperationalWorkspaceConfig["permission"],
): OperationalWorkspaceConfig {
  return {
    allowedRoles: ["collection_driver", "collection_manager", "operations_manager", "admin", "super_admin"],
    actions: [
      { href: "/dashboard/collection/routes", label: "Tournees", permission: "collection:read" },
      { href: "/dashboard/collection/manifests", label: "Manifestes", permission: "collection:read" },
      { href: "/dashboard/collection/scanner", label: "Scanner", permission: "collection:write" },
    ],
    checkpoints: ["Tournée planifiée.", "Chargement scanne.", "Remise hub horodatee."],
    description,
    eyebrow: "Collecte",
    metrics: [
      { label: "Tournees", table: "collection_routes" },
      { label: "Arrets", table: "collection_route_stops" },
      { label: "Manifestes", table: "collection_manifests" },
    ],
    permission,
    scene: "operations",
    title,
  };
}

function travelerConfig(
  title: string,
  description: string,
  permission: OperationalWorkspaceConfig["permission"],
): OperationalWorkspaceConfig {
  return {
    allowedRoles: ["traveler"],
    actions: [
      { href: "/dashboard/traveler/trips/new", label: "Ajouter un voyage", permission: "traveler:write" },
      { href: "/dashboard/traveler/trips", label: "Mes voyages", permission: "traveler:read" },
      { href: "/dashboard/traveler/qr-codes", label: "QR codes", permission: "qr:read" },
    ],
    checkpoints: ["Identité vérifiée.", "Billet validé.", "Capacité réservée.", "Code de remise contrôlé."],
    description,
    eyebrow: "Voyageur",
    metrics: [
      { label: "Voyages", table: "trips", userColumn: "traveler_id" },
      { label: "Billets", table: "traveler_documents", userColumn: "traveler_id" },
      { label: "Lots", table: "hub_batches", userColumn: "traveler_id" },
      { label: "Versements", table: "payouts", userColumn: "beneficiary_id" },
    ],
    permission,
    scene: "traveler",
    title,
  };
}

function hubConfig(
  title: string,
  description: string,
  permission: OperationalWorkspaceConfig["permission"],
): OperationalWorkspaceConfig {
  return {
    allowedRoles: ["hub_agent", "hub_manager", "operations_manager", "admin", "super_admin"],
    actions: [
      { href: "/dashboard/hub/inbound", label: "Reception", permission: "hub:write" },
      { href: "/dashboard/hub/batches", label: "Lots", permission: "hub:read" },
      { href: "/dashboard/hub/handover", label: "QR handover", permission: "qr:write" },
    ],
    checkpoints: ["Reception hub.", "Inspection.", "Reservation capacite.", "Remise voyageur."],
    description,
    eyebrow: "Hub",
    metrics: [
      { label: "Lots", table: "hub_batches" },
      { label: "Inspections", table: "hub_package_inspections" },
      { label: "Reservations", table: "capacity_reservations" },
      { label: "QR", table: "handover_qr_tokens" },
    ],
    permission,
    scene: "hub",
    title,
  };
}

function adminConfig(
  title: string,
  description: string,
  permission: OperationalWorkspaceConfig["permission"],
  metrics: WorkspaceMetric[],
): OperationalWorkspaceConfig {
  return {
    allowedRoles: ["operations_manager", "support_agent", "finance_agent", "admin", "super_admin"],
    actions: [
      { href: "/dashboard/admin/users", label: "Utilisateurs", permission: "admin:read" },
      { href: "/dashboard/admin/shipments", label: "Expeditions", permission: "shipment:read" },
      { href: "/dashboard/admin/audit", label: "Audit", permission: "admin:read" },
      { href: "/dashboard/admin/settings", label: "Parametres", permission: "super_admin:write" },
    ],
    checkpoints: [
      "Acces protege par role interne.",
      "Compteurs lus depuis Supabase avec RLS.",
      "Actions critiques a auditer dans audit_log_events.",
    ],
    description,
    eyebrow: "Admin",
    metrics,
    permission,
    scene: "admin",
    title,
  };
}

function operationsConfig(
  title: string,
  description: string,
  metrics: WorkspaceMetric[],
  permission: OperationalWorkspaceConfig["permission"] = "operations:read",
): OperationalWorkspaceConfig {
  return {
    allowedRoles: ["operations_manager", "admin", "super_admin"],
    actions: [
      { href: "/dashboard/operations/shipments", label: "Expeditions", permission: "operations:read" },
      { href: "/dashboard/operations/dispatch", label: "Dispatch", permission: "dispatch:write" },
      { href: "/dashboard/operations/anomalies", label: "Anomalies", permission: "operations:write" },
      { href: "/dashboard/hub", label: "Hub", permission: "hub:read" },
    ],
    checkpoints: [
      "Lecture globale des flux critiques.",
      "Intervention manuelle reservee operations/admin.",
      "Historique et audit a conserver pour chaque correction.",
    ],
    description,
    eyebrow: "Operations",
    metrics,
    permission,
    scene: "operations",
    title,
  };
}
