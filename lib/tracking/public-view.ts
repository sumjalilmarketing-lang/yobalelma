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
  cancelled: "Annule",
  confirmed: "Expedition confirmee",
  delivered: "Livre",
  in_transit: "En transit",
  matching: "Recherche d'un livreur",
  out_for_delivery: "En livraison",
  picked_up: "Colis recupere",
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
): PublicTrackingShipment {
  return {
    createdAt: shipment.created_at,
    destination: `${shipment.destination_city}, ${shipment.destination_country}`,
    eta: `${shipment.eta_min_days}-${shipment.eta_max_days} jours`,
    events: events.map((event) => ({
      id: event.id,
      label: publicStatusLabels[event.status] ?? event.status,
      status: event.status,
      timestamp: event.created_at,
    })),
    origin: `${shipment.origin_city}, ${shipment.origin_country}`,
    scope: shipment.scope,
    status: shipment.status,
    statusLabel: publicStatusLabels[shipment.status] ?? shipment.status,
    trackingCode: shipment.tracking_code,
    updatedAt: shipment.updated_at,
  };
}
