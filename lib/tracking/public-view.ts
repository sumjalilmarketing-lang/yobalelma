import type { Database } from "@/types/database.types";

export type PublicShipmentRow = Pick<
  Database["public"]["Tables"]["shipments"]["Row"],
  | "created_at"
  | "destination_city"
  | "destination_country"
  | "eta_max_days"
  | "eta_min_days"
  | "id"
  | "origin_city"
  | "origin_country"
  | "scope"
  | "status"
  | "tracking_code"
  | "updated_at"
>;

export type PublicShipmentEventRow = Pick<
  Database["public"]["Tables"]["shipment_status_events"]["Row"],
  "created_at" | "id" | "status"
>;

export type PublicFinalDeliveryEventRow = {
  created_at: string;
  event_type: string;
  id: string;
  status: string;
};

export type PublicTrackingEvent = {
  id: string;
  label: string;
  status: string;
  timestamp: string;
};

export type PublicTrackingShipment = {
  createdAt: string;
  destination: string;
  eta: string;
  events: PublicTrackingEvent[];
  origin: string;
  scope: string;
  status: string;
  statusLabel: string;
  trackingCode: string;
  updatedAt: string;
};

const trackingCodePattern = /^YBL-[A-Z0-9]{8}$/;

const publicStatusLabels: Record<string, string> = {
  assigned: "Mission assignee",
  at_hub: "Arrive au hub",
  at_relay: "Depose au relais",
  cancelled: "Annule",
  collected_for_hub: "Collecte vers le hub",
  confirmed: "Expedition confirmee",
  delivered: "Livre",
  in_transit: "En transit",
  matching: "Recherche d'un livreur",
  out_for_delivery: "En livraison",
  picked_up: "Colis recupere",
};

const publicFinalDeliveryStatusLabels: Record<string, string> = {
  awaiting_final_delivery: "Livraison finale programmee",
  awaiting_recipient_pickup: "Pret pour retrait",
  delivery_assigned: "Livreur final assigne",
  delivery_attempted: "Tentative de livraison",
  delivery_blocked: "Action support requise",
  delivery_rescheduled: "Livraison reprogrammee",
  delivered: "Livre",
  destination_batch_received: "Arrive dans le pays de destination",
  destination_package_confirmed: "Recu au point relais destination",
  destination_package_damaged: "Incident ouvert",
  destination_package_missing: "Incident ouvert",
  invalid_address: "Adresse a verifier",
  out_for_delivery: "En cours de livraison",
  ready_for_recipient: "Pret pour remise",
  recipient_absent: "Destinataire absent",
  refused_by_recipient: "Remise refusee",
  returned_to_relay: "Retourne au relais",
};

export function normalizeTrackingCode(value: string) {
  const compact = value.trim().toUpperCase().replace(/\s+/g, "");

  if (/^YBL[A-Z0-9]{8}$/.test(compact)) {
    return `YBL-${compact.slice(3)}`;
  }

  return compact;
}

export function isValidTrackingCode(value: string) {
  return trackingCodePattern.test(normalizeTrackingCode(value));
}

export function toPublicTrackingShipment(
  shipment: PublicShipmentRow,
  events: PublicShipmentEventRow[],
  finalDeliveryEvents: PublicFinalDeliveryEventRow[] = [],
): PublicTrackingShipment {
  const publicEvents = [
    ...events.map((event) => ({
      id: event.id,
      label: publicStatusLabels[event.status] ?? event.status,
      status: event.status,
      timestamp: event.created_at,
    })),
    ...finalDeliveryEvents.map((event) => ({
      id: event.id,
      label: publicFinalDeliveryStatusLabels[event.status] ?? "Mise a jour destination",
      status: event.status,
      timestamp: event.created_at,
    })),
  ].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  return {
    createdAt: shipment.created_at,
    destination: `${shipment.destination_city}, ${shipment.destination_country}`,
    eta: `${shipment.eta_min_days}-${shipment.eta_max_days} jours`,
    events: publicEvents,
    origin: `${shipment.origin_city}, ${shipment.origin_country}`,
    scope: shipment.scope,
    status: shipment.status,
    statusLabel: publicStatusLabels[shipment.status] ?? shipment.status,
    trackingCode: shipment.tracking_code,
    updatedAt: shipment.updated_at,
  };
}
