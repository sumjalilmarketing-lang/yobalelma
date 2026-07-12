import type { OperationalWorkspaceConfig } from "@/components/dashboard/operational-workspace";

export const workspaceConfigs = {
  "client/tracking": {
    allowedRoles: ["client"],
    actions: [
      { href: "/dashboard/client/shipments", label: "Mes expeditions", permission: "shipment:read" },
      { href: "/dashboard/client/support", label: "Ouvrir un ticket", permission: "support:write" },
    ],
    checkpoints: [
      "Code tracking unique cree cote serveur.",
      "Evenements shipment_status_events consultables par le client.",
      "Preuves de livraison rattachees au colis.",
    ],
    description: "Timeline privee des expeditions, preuves et statuts operationnels.",
    emptyTitle: "Tracking client",
    eyebrow: "Client",
    metrics: [
      { label: "Expeditions", table: "shipments", userColumn: "sender_id" },
      { label: "Evenements", table: "shipment_status_events" },
      { label: "Preuves", table: "delivery_proofs" },
    ],
    permission: "shipment:track",
    scene: "client",
    title: "Tracking et timeline",
  },
  "client/payments": {
    allowedRoles: ["client"],
    actions: [
      { href: "/dashboard/client/shipments/new", label: "Nouvelle expedition", permission: "shipment:write" },
      { href: "/dashboard/client/support", label: "Support paiement", permission: "support:write" },
    ],
    checkpoints: [
      "Payment intents sandbox rattaches au payeur.",
      "Frais et devise lus depuis Supabase.",
      "Litiges paiement disponibles via support.",
    ],
    description: "Paiements sandbox, frais et historique des transactions du client.",
    emptyTitle: "Paiements sandbox",
    eyebrow: "Client",
    metrics: [
      { label: "Paiements", table: "payment_intents", userColumn: "payer_id" },
      { label: "Expeditions payables", table: "shipments", userColumn: "sender_id" },
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
      "Tickets support relies au requester_id.",
      "Messages conserves dans support_messages.",
      "Escalade possible vers support agent.",
    ],
    description: "Messages et conversations liees aux expeditions.",
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
      "Ouverture ticket par client authentifie.",
      "Categorie et priorite conservees.",
      "Suivi SLA a finaliser cote support.",
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
      "Adresses expediteur et destinataire archivees par expedition.",
      "Adresse profil stockee sur profiles.",
      "Carnet d'adresses dedie a creer pour la production.",
    ],
    description: "Adresses utilisees par les expeditions et profil client.",
    emptyTitle: "Adresses",
    eyebrow: "Client",
    metrics: [
      { label: "Adresses expeditions", table: "shipment_addresses" },
      { label: "Expeditions", table: "shipments", userColumn: "sender_id" },
    ],
    permission: "client:read",
    scene: "client",
    title: "Adresses",
  },
  "client/profile": {
    allowedRoles: ["client"],
    actions: [
      { href: "/dashboard/client/kyc", label: "KYC", permission: "client:write" },
      { href: "/dashboard/client/notifications", label: "Notifications", permission: "client:read" },
    ],
    checkpoints: [
      "Profil cree par trigger Auth.",
      "Telephone, pays, ville et adresse stockes.",
      "Avatar via bucket avatars.",
    ],
    description: "Identite, adresse, avatar et statut du compte client.",
    emptyTitle: "Profil client",
    eyebrow: "Client",
    metrics: [
      { label: "Profil", table: "profiles", filter: { column: "primary_role", value: "client" } },
      { label: "KYC", table: "identity_verifications", userColumn: "profile_id" },
    ],
    permission: "client:read",
    scene: "client",
    title: "Profil",
  },
  "client/notifications": {
    allowedRoles: ["client"],
    actions: [
      { href: "/dashboard/client/shipments", label: "Expeditions", permission: "shipment:read" },
      { href: "/dashboard/client/support", label: "Support", permission: "support:read" },
    ],
    checkpoints: [
      "Notifications in-app par recipient_id.",
      "Lecture possible via RPC mark_notification_read.",
      "Canaux email/SMS/WhatsApp restent externes.",
    ],
    description: "Alertes shipment, paiement, mission et support.",
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
      "Payouts rattaches au beneficiary_id.",
      "Payout bloque si incident QR destination.",
      "Liberation reelle a brancher au provider payout.",
    ],
    description: "Gains et payouts sandbox du livreur local.",
    emptyTitle: "Gains livreur",
    eyebrow: "Livreur",
    metrics: [
      { label: "Payouts", table: "payouts", userColumn: "beneficiary_id" },
      { label: "Missions livrees", table: "local_delivery_missions", userColumn: "transporter_id", filter: { column: "status", value: "delivered" } },
    ],
    permission: "payout:read",
    scene: "transporter",
    title: "Gains",
  },
  "transporter/kyc": {
    allowedRoles: ["local_transporter"],
    actions: [
      { href: "/dashboard/kyc", label: "Soumettre KYC", permission: "transporter:write" },
      { href: "/dashboard/transporter/profile", label: "Profil", permission: "transporter:read" },
    ],
    checkpoints: [
      "Identite requise avant activation.",
      "Documents stockes dans bucket prive.",
      "Validation admin/support a finaliser.",
    ],
    description: "Verification livreur et statut d'activation.",
    emptyTitle: "KYC livreur",
    eyebrow: "Livreur",
    metrics: [
      { label: "Demandes KYC", table: "identity_verifications", userColumn: "profile_id" },
      { label: "Documents", table: "identity_verification_documents", userColumn: "profile_id" },
    ],
    permission: "transporter:read",
    scene: "transporter",
    title: "KYC",
  },
  "transporter/ratings": {
    allowedRoles: ["local_transporter"],
    actions: [
      { href: "/dashboard/transporter/missions/history", label: "Historique", permission: "mission:read" },
    ],
    checkpoints: [
      "Rating stocke sur transporter_profiles.",
      "Missions terminees comptabilisees.",
      "Avis detaille a modeliser avant production.",
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
      "Tickets requester_id livreur.",
      "Messages conserves par auteur.",
      "Escalade operations possible.",
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
      "Profil transporteur lie a profiles.",
      "Vehicules et zones separes.",
      "Disponibilites dediees.",
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
      "Notifications mission_update par recipient_id.",
      "Notifications non reelles externes documentees.",
      "Lecture in-app disponible.",
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
  "traveler/tickets": travelerConfig("Billets", "Billets d'avion soumis et validation sandbox.", "traveler:read"),
  "traveler/capacity": travelerConfig("Capacite", "Capacite disponible et reservations hub.", "traveler:read"),
  "traveler/assignments": travelerConfig("Assignations", "Lots et colis associes au voyageur.", "traveler:read"),
  "traveler/earnings": travelerConfig("Gains voyageur", "Payouts sandbox du voyageur.", "payout:read"),
  "traveler/payments": travelerConfig("Paiements voyageur", "Historique de remuneration et blocages.", "payout:read"),
  "traveler/history": travelerConfig("Historique voyageur", "Trajets, lots et remises passes.", "traveler:read"),
  "traveler/support": travelerConfig("Support voyageur", "Tickets voyageur et incidents.", "support:read"),
  "traveler/profile": travelerConfig("Profil voyageur", "Profil, KYC, passeport et informations utiles.", "traveler:read"),
  "traveler/notifications": travelerConfig("Notifications voyageur", "Alertes hub, QR et support.", "traveler:read"),
  "hub/storage": hubConfig("Stockage hub", "Emplacements, inspections et inventaire hub.", "hub:read"),
  "hub/inspection": hubConfig("Inspection hub", "Controle poids, dimensions, photos et decision.", "hub:write"),
  "hub/scanner": hubConfig("Scanner hub", "Scans QR, lots et remises voyageur.", "qr:write"),
  "hub/anomalies": hubConfig("Anomalies hub", "Colis manquants, endommages ou refuses.", "hub:write"),
  "hub/history": hubConfig("Historique hub", "Lots, reservations et inspections passees.", "hub:read"),
  "hub/profile": hubConfig("Profil hub", "Equipe, site, capacite et statut operationnel.", "hub:read"),
  "hub/notifications": hubConfig("Notifications hub", "Alertes collecte, voyageur et anomalies.", "hub:read"),
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
    allowedRoles: ["relay_agent", "operations_manager", "admin", "super_admin"],
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
    allowedRoles: ["collection_driver", "operations_manager", "admin", "super_admin"],
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
    checkpoints: ["KYC voyageur.", "Billet valide.", "Capacite reservee.", "QR scanne."],
    description,
    eyebrow: "Voyageur",
    metrics: [
      { label: "Voyages", table: "trips", userColumn: "traveler_id" },
      { label: "Billets", table: "traveler_documents", userColumn: "traveler_id" },
      { label: "Lots", table: "hub_batches", userColumn: "traveler_id" },
      { label: "Payouts", table: "payouts", userColumn: "beneficiary_id" },
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
    allowedRoles: ["hub_agent", "operations_manager", "admin", "super_admin"],
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

