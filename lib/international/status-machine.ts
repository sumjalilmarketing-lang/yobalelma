import type { PlatformRole } from "@/lib/auth/roles";
import type { Database } from "@/types/database.types";

export type ShipmentStatus = Database["public"]["Enums"]["shipment_status"];

export type InternationalWorkflowStep = {
  id: string;
  label: string;
  description: string;
  owner: "client" | "transporter" | "relay" | "collection" | "hub" | "traveler" | "destination";
  requiredEvidence: string;
  mappedStatuses: ShipmentStatus[];
};

export const internationalWorkflowSteps: InternationalWorkflowStep[] = [
  {
    id: "shipment_created",
    label: "Expedition creee",
    description: "Le client cree un envoi et le systeme detecte le flux international.",
    owner: "client",
    requiredEvidence: "Code tracking, pays origine/destination, confirmation client.",
    mappedStatuses: ["confirmed"],
  },
  {
    id: "pickup_requested",
    label: "Enlevement ou depot choisi",
    description: "Le client choisit un pickup local ou un depot direct au relais origine.",
    owner: "client",
    requiredEvidence: "Fulfillment method et date preferee.",
    mappedStatuses: ["matching"],
  },
  {
    id: "local_transporter_assigned",
    label: "Livreur local assigne",
    description: "Un livreur local prend en charge la mission de premier kilometre.",
    owner: "transporter",
    requiredEvidence: "Mission acceptee, identite transporteur et horaires.",
    mappedStatuses: ["assigned"],
  },
  {
    id: "picked_up_from_sender",
    label: "Colis recupere",
    description: "Le colis est physiquement recupere chez l'expediteur.",
    owner: "transporter",
    requiredEvidence: "Scan pickup, photo ou note operationnelle.",
    mappedStatuses: ["picked_up"],
  },
  {
    id: "received_at_origin_relay",
    label: "Reception relais origine",
    description: "Le relais origine scanne le colis et ouvre l'inventaire relais.",
    owner: "relay",
    requiredEvidence: "Scan check-in et point relais.",
    mappedStatuses: ["at_relay"],
  },
  {
    id: "stored_at_origin_relay",
    label: "Stockage relais",
    description: "Le colis attend la collecte hub dans un point relais actif.",
    owner: "relay",
    requiredEvidence: "Ligne relay_inventory au statut stored.",
    mappedStatuses: ["at_relay"],
  },
  {
    id: "ready_for_collection",
    label: "Pret pour collecte",
    description: "Le colis est eligible pour manifeste de collecte vers hub.",
    owner: "relay",
    requiredEvidence: "Inventaire relais et scan de sortie prepares.",
    mappedStatuses: ["at_relay"],
  },
  {
    id: "loaded_from_relay",
    label: "Charge depuis relais",
    description: "Le chauffeur collecte ajoute le colis au manifeste.",
    owner: "collection",
    requiredEvidence: "Item de manifeste et scan check-out.",
    mappedStatuses: ["collected_for_hub"],
  },
  {
    id: "in_transit_to_hub",
    label: "Transit vers hub",
    description: "La tournee transporte les colis du relais vers le hub.",
    owner: "collection",
    requiredEvidence: "Tournee, manifeste scelle, horodatage.",
    mappedStatuses: ["collected_for_hub"],
  },
  {
    id: "received_at_hub",
    label: "Reception hub",
    description: "Le hub confirme le manifeste et rapproche les colis attendus.",
    owner: "hub",
    requiredEvidence: "Reception hub et evenements shipment_status_events.",
    mappedStatuses: ["at_hub"],
  },
  {
    id: "inspected_at_hub",
    label: "Inspection hub",
    description: "Poids, emballage, fragilite et destination sont controles.",
    owner: "hub",
    requiredEvidence: "Inspection, decision et photos si necessaires.",
    mappedStatuses: ["at_hub"],
  },
  {
    id: "stored_at_hub",
    label: "Stockage hub",
    description: "Le colis est place en zone hub jusqu'a reservation capacite.",
    owner: "hub",
    requiredEvidence: "Inventaire hub et emplacement.",
    mappedStatuses: ["at_hub"],
  },
  {
    id: "traveler_trip_validated",
    label: "Voyage valide",
    description: "Le voyageur publie un trajet et son billet est verifie.",
    owner: "traveler",
    requiredEvidence: "Trip, billet et statut KYC.",
    mappedStatuses: ["at_hub"],
  },
  {
    id: "traveler_capacity_declared",
    label: "Capacite declaree",
    description: "La capacite disponible est reservee par le hub.",
    owner: "traveler",
    requiredEvidence: "Reservation de capacite et poids reserve.",
    mappedStatuses: ["at_hub"],
  },
  {
    id: "assigned_to_batch",
    label: "Assigne a un lot",
    description: "Le colis rejoint un lot hub avec destination et vol.",
    owner: "hub",
    requiredEvidence: "Hub batch et capacity_reservation.",
    mappedStatuses: ["at_hub"],
  },
  {
    id: "batch_ready",
    label: "Lot pret",
    description: "Le lot est prepare, scelle et pret pour remise voyageur.",
    owner: "hub",
    requiredEvidence: "Batch pret, anomalie traitee, QR actif.",
    mappedStatuses: ["at_hub"],
  },
  {
    id: "pickup_qr_generated",
    label: "QR retrait genere",
    description: "Le hub genere un QR de retrait pour le voyageur.",
    owner: "hub",
    requiredEvidence: "Token QR pickup actif et date d'expiration.",
    mappedStatuses: ["at_hub"],
  },
  {
    id: "handed_to_traveler",
    label: "Remis au voyageur",
    description: "Le QR de retrait est scanne et le lot part avec le voyageur.",
    owner: "traveler",
    requiredEvidence: "Scan QR pickup et preuve de remise.",
    mappedStatuses: ["in_transit"],
  },
  {
    id: "destination_qr_generated",
    label: "QR destination genere",
    description: "Un QR destination permet de deposer le lot au relais d'arrivee.",
    owner: "traveler",
    requiredEvidence: "Token QR destination actif.",
    mappedStatuses: ["in_transit"],
  },
  {
    id: "received_at_destination_relay",
    label: "Reception relais destination",
    description: "Le relais destination scanne le QR et receptionne le lot.",
    owner: "destination",
    requiredEvidence: "Scan QR destination et inventaire destination.",
    mappedStatuses: ["out_for_delivery"],
  },
  {
    id: "ready_for_final_delivery",
    label: "Pret choix destinataire",
    description: "Le colis est en stock destination et le destinataire peut choisir retrait ou livraison finale.",
    owner: "destination",
    requiredEvidence: "Final delivery order, notification et emplacement destination.",
    mappedStatuses: ["out_for_delivery"],
  },
  {
    id: "recipient_delivery_choice",
    label: "Choix remise final",
    description: "Retrait relais ou livraison domicile est selectionne et audite.",
    owner: "destination",
    requiredEvidence: "Delivery mode, acteur autorise et audit de modification.",
    mappedStatuses: ["out_for_delivery"],
  },
  {
    id: "secure_delivery_otp",
    label: "OTP securise",
    description: "Un OTP hash en base est genere, expire automatiquement et remplace les codes precedents.",
    owner: "destination",
    requiredEvidence: "delivery_otps, otp_events et notification in-app/sandbox.",
    mappedStatuses: ["out_for_delivery"],
  },
  {
    id: "final_mile_or_counter",
    label: "Remise comptoir ou dernier kilometre",
    description: "Le relais remet au comptoir ou declenche une mission relay_to_recipient.",
    owner: "destination",
    requiredEvidence: "Mission finale, tentative, signature ou validation digitale.",
    mappedStatuses: ["out_for_delivery"],
  },
  {
    id: "delivered",
    label: "Livre",
    description: "La livraison est confirmee et les preuves sont rattachees au colis.",
    owner: "destination",
    requiredEvidence: "Preuve de livraison, OTP ou QR utilise.",
    mappedStatuses: ["delivered"],
  },
  {
    id: "incident_opened",
    label: "Incident ouvert",
    description: "Une anomalie bloque ou surveille une etape critique.",
    owner: "hub",
    requiredEvidence: "Ticket, litige ou incident operationnel.",
    mappedStatuses: ["at_hub"],
  },
  {
    id: "incident_resolved",
    label: "Incident resolu",
    description: "L'action corrective est documentee et le flux peut reprendre.",
    owner: "hub",
    requiredEvidence: "Audit et statut de resolution.",
    mappedStatuses: ["at_hub"],
  },
];

const roleActionMap: Record<
  "client" | "transporter" | "relay" | "collection" | "hub" | "traveler" | "admin",
  Array<{ href: string; label: string; description: string }>
> = {
  admin: [
    {
      href: "/dashboard/admin/shipments",
      label: "Superviser les expeditions",
      description: "Voir les expeditions, statuts et corrections auditees.",
    },
    {
      href: "/dashboard/admin/batches",
      label: "Piloter les lots",
      description: "Controler les batches, reservations et handovers.",
    },
    {
      href: "/dashboard/admin/audit",
      label: "Consulter l'audit",
      description: "Verifier les actions sensibles du parcours international.",
    },
    {
      href: "/dashboard/admin/payout-review",
      label: "Revue payout",
      description: "Verifier les eligibilites voyageur et livreur final.",
    },
  ],
  client: [
    {
      href: "/dashboard/client/shipments/new",
      label: "Creer un envoi international",
      description: "Saisir deux pays differents pour declencher le flux international.",
    },
    {
      href: "/dashboard/client/shipments",
      label: "Suivre mes expeditions",
      description: "Voir tracking, statut, prix et mode de depart.",
    },
    {
      href: "/dashboard/client/tracking",
      label: "Timeline privee",
      description: "Controler les evenements et preuves rattaches a mes colis.",
    },
  ],
  collection: [
    {
      href: "/dashboard/collection/routes",
      label: "Creer une tournee",
      description: "Planifier le trajet relais vers hub.",
    },
    {
      href: "/dashboard/collection/manifests",
      label: "Creer un manifeste",
      description: "Sceller un manifeste et ajouter les colis collectes.",
    },
    {
      href: "/dashboard/collection/incidents",
      label: "Declarer un incident",
      description: "Signaler retard, colis absent ou ecart manifeste.",
    },
  ],
  hub: [
    {
      href: "/dashboard/hub/inbound",
      label: "Receptionner au hub",
      description: "Confirmer un manifeste et pointer les colis recus.",
    },
    {
      href: "/dashboard/hub/batches/new",
      label: "Creer un lot",
      description: "Associer destination, voyageur, vol et capacite.",
    },
    {
      href: "/dashboard/hub/handover",
      label: "Generer / scanner QR",
      description: "Preparations de remise voyageur et preuves QR.",
    },
  ],
  relay: [
    {
      href: "/dashboard/relay/inbound",
      label: "Scanner une entree",
      description: "Receptionner un colis au relais origine.",
    },
    {
      href: "/dashboard/relay/outbound",
      label: "Preparer la sortie",
      description: "Sortir un colis vers la collecte hub.",
    },
    {
      href: "/dashboard/relay/destination-reception",
      label: "Reception destination",
      description: "Scanner le QR destination et rendre le colis disponible.",
    },
    {
      href: "/dashboard/relay/final-delivery",
      label: "Livraison finale",
      description: "Gerer OTP, retrait destinataire, dernier kilometre et preuves.",
    },
  ],
  transporter: [
    {
      href: "/dashboard/transporter/missions/available",
      label: "Missions disponibles",
      description: "Accepter une mission de premier kilometre.",
    },
    {
      href: "/dashboard/transporter/missions",
      label: "Mes missions",
      description: "Suivre pickup, arrivee et livraison locale.",
    },
    {
      href: "/dashboard/transporter/notifications",
      label: "Alertes terrain",
      description: "Voir les notifications mission et statut.",
    },
  ],
  traveler: [
    {
      href: "/dashboard/traveler/trips/new",
      label: "Publier un voyage",
      description: "Declarer route, dates et capacite disponible.",
    },
    {
      href: "/dashboard/traveler/tickets",
      label: "Ajouter un billet",
      description: "Soumettre le document de voyage pour validation.",
    },
    {
      href: "/dashboard/traveler/qr-codes",
      label: "Mes QR codes",
      description: "Presenter le QR retrait et destination au bon moment.",
    },
  ],
};

export type InternationalRoleWorkspace =
  | "client"
  | "transporter"
  | "relay"
  | "collection"
  | "hub"
  | "traveler"
  | "admin";

export function workspaceForRole(role: PlatformRole): InternationalRoleWorkspace {
  if (role === "local_transporter") return "transporter";
  if (role === "traveler") return "traveler";
  if (role === "relay_agent" || role === "relay_manager") return "relay";
  if (role === "collection_driver" || role === "collection_manager") return "collection";
  if (role === "hub_agent" || role === "hub_manager") return "hub";
  if (role === "admin" || role === "super_admin" || role === "operations_manager") return "admin";
  return "client";
}

export function actionsForInternationalWorkspace(workspace: InternationalRoleWorkspace) {
  return roleActionMap[workspace];
}

export function stepProgressForStatus(status: ShipmentStatus) {
  const lastIndex = internationalWorkflowSteps.findLastIndex((step) =>
    step.mappedStatuses.includes(status),
  );

  if (lastIndex < 0) {
    return {
      completed: 0,
      currentStep: internationalWorkflowSteps[0],
      nextStep: internationalWorkflowSteps[1] ?? null,
      total: internationalWorkflowSteps.length,
    };
  }

  return {
    completed: lastIndex + 1,
    currentStep: internationalWorkflowSteps[lastIndex],
    nextStep: internationalWorkflowSteps[lastIndex + 1] ?? null,
    total: internationalWorkflowSteps.length,
  };
}

export function isStepCompletedByStatus(step: InternationalWorkflowStep, status: ShipmentStatus) {
  const current = stepProgressForStatus(status).completed;
  const stepIndex = internationalWorkflowSteps.findIndex((item) => item.id === step.id);

  return stepIndex > -1 && stepIndex < current;
}
