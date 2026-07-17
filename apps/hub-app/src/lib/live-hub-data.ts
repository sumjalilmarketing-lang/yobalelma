import "server-only";

import { z } from "zod";
import { tryCreateSupabaseServerClient } from "@/lib/supabase/server";
import { fromSupabaseTable } from "./supabase-loose";
import type { HubState } from "./hub-store";
import type {
  AnomalyStatus,
  AnomalyType,
  BatchStatus,
  HubSession,
  InboundItemStatus,
  InventoryStatus,
  Priority,
  ShipmentStatus,
  StorageLocation,
} from "./types";

const rowSchema = z.record(z.string(), z.unknown());

type Row = z.infer<typeof rowSchema>;
type SupabaseClient = NonNullable<Awaited<ReturnType<typeof tryCreateSupabaseServerClient>>>;

const text = (row: Row, key: string, fallback = "") =>
  typeof row[key] === "string" ? row[key] : fallback;
const nullableText = (row: Row, key: string) =>
  typeof row[key] === "string" ? row[key] : undefined;
const number = (row: Row, key: string, fallback = 0) =>
  typeof row[key] === "number" ? row[key] : fallback;
const boolean = (row: Row, key: string, fallback = false) =>
  typeof row[key] === "boolean" ? row[key] : fallback;
const strings = (row: Row, key: string) =>
  Array.isArray(row[key]) ? row[key].filter((value): value is string => typeof value === "string") : [];
const metadata = (row: Row, key = "metadata") => rowSchema.safeParse(row[key]).data ?? {};

async function rows(
  client: SupabaseClient,
  table: string,
  columns: string,
  filter?: [string, unknown],
) {
  let query = fromSupabaseTable(client, table).select<Row>(columns);

  if (filter) query = query.eq(filter[0], filter[1]);

  const result = await query;

  if (result.error) throw new Error(`${table}: ${result.error.message}`);

  return z.array(rowSchema).parse(result.data ?? []);
}

async function optionalRows(
  client: SupabaseClient,
  table: string,
  columns: string,
  filter?: [string, unknown],
) {
  try {
    return await rows(client, table, columns, filter);
  } catch {
    return [];
  }
}

const oneOf = <T extends string>(value: string, allowed: readonly T[], fallback: T): T =>
  allowed.includes(value as T) ? (value as T) : fallback;

const priority = (value: string): Priority =>
  oneOf(value, ["low", "medium", "high", "urgent", "critical"] as const, "medium");

const shipmentStatus = (value: string): ShipmentStatus => {
  const map: Record<string, ShipmentStatus> = {
    at_origin_hub: "at_hub",
    batch_assigned: "reserved_for_batch",
    hub_inspection: "inspection_required",
    in_origin_storage: "in_storage",
    ready_for_departure: "ready_for_handover",
  };

  return oneOf(
    map[value] ?? value,
    ["expected_at_hub", "at_hub", "inspection_required", "approved_for_storage", "in_storage", "reserved_for_batch", "picked_for_batch", "ready_for_handover", "handed_over_to_traveler", "quarantined_at_hub", "blocked", "missing_at_hub", "damaged_at_hub"] as const,
    "at_hub",
  );
};

const inboundStatus = (value: string): InboundItemStatus => {
  const map: Record<string, InboundItemStatus> = {
    damaged: "damaged_at_hub",
    expected: "expected_at_hub",
    extra: "extra_at_hub",
    missing: "missing_at_hub",
    quarantined: "quarantined_at_hub",
    received: "received_at_hub",
    rejected: "rejected_at_hub",
  };

  return map[value] ?? oneOf(value, ["expected_at_hub", "arrived_at_hub", "received_at_hub", "partially_received", "missing_at_hub", "extra_at_hub", "damaged_at_hub", "rejected_at_hub", "quarantined_at_hub"] as const, "expected_at_hub");
};

const inventoryStatus = (value: string): InventoryStatus =>
  oneOf(value, ["received", "inspection_required", "approved", "quarantined", "rejected", "in_storage", "reserved_for_batch", "picked_for_batch", "handed_over", "damaged", "missing"] as const, "received");

const batchStatus = (value: string): BatchStatus => {
  const map: Record<string, BatchStatus> = { delivered: "completed", open: "draft", sealed: "ready" };

  return oneOf(map[value] ?? value, ["draft", "capacity_reserved", "preparing", "awaiting_validation", "ready", "pickup_qr_generated", "handed_over", "in_transit", "destination_received", "partially_received", "disputed", "completed", "cancelled"] as const, "draft");
};

const locationType = (value: string): StorageLocation["type"] => {
  if (value.includes("quarantine")) return "quarantine";
  if (value.includes("inspection")) return "inspection";
  if (value.includes("preparation") || value.includes("batch")) return "preparation";
  if (value.includes("reception") || value.includes("receiv")) return "reception";
  return "storage";
};

/** Loads the authenticated Hub read model. Demo sessions intentionally keep the in-memory fixture. */
export async function loadLiveHubState(session: HubSession): Promise<HubState | null> {
  if (session.source !== "supabase" || !session.userId) return null;

  const client = await tryCreateSupabaseServerClient();

  if (!client) return null;

  const { data: auth } = await client.auth.getUser();

  if (auth.user?.id !== session.userId) return null;

  try {
    const [
      hubRows,
      receiptRows,
      inventoryRows,
      locationRows,
      zoneRows,
      aisleRows,
      shelfRows,
      inspectionRows,
      batchRows,
      incidentRows,
      notificationRows,
    ] = await Promise.all([
      rows(client, "airport_hubs", "id, code, name, country, city, airport_code, timezone", ["id", session.hubId]),
      rows(client, "hub_inbound_receipts", "id, hub_id, receipt_code, status, expected_count, received_count, missing_count, damaged_count, extra_count, received_at, created_at, note", ["hub_id", session.hubId]),
      rows(client, "hub_inventory", "id, shipment_id, hub_id, location_id, status, destination_country, destination_city, priority, measured_weight_kg, entered_at, last_movement_at, active", ["hub_id", session.hubId]),
      rows(client, "hub_storage_locations", "id, hub_id, zone_id, aisle_id, shelf_id, code, location_type, max_weight_kg", ["hub_id", session.hubId]),
      rows(client, "hub_zones", "id, code, name, zone_type", ["hub_id", session.hubId]),
      rows(client, "hub_aisles", "id, code, name", ["hub_id", session.hubId]),
      rows(client, "hub_shelves", "id, code, max_weight_kg", ["hub_id", session.hubId]),
      rows(client, "hub_inspections", "shipment_id, declared_weight_kg, measured_weight_kg, package_condition, packaging_compliant, weight_variance_percent, decision, note, inspected_at", ["hub_id", session.hubId]),
      rows(client, "hub_batches", "id, code, capacity_kg, reserved_weight_kg, status, destination_country, destination_city, preparation_location_id, traveler_id, trip_id, validated_by, handover_deadline_at, departure_date, hub_id", ["hub_id", session.hubId]),
      rows(client, "operational_incidents", "id, incident_type, status, priority, hub_id, shipment_id, batch_id, assigned_to, title, description, photo_paths, blocks_shipment, blocks_batch, blocks_payout, created_at", ["hub_id", session.hubId]),
      optionalRows(client, "notifications", "id, title, body, metadata, read_at, created_at", ["recipient_id", session.userId]),
    ]);

    if (hubRows.length === 0) {
      throw new Error("The authenticated Hub is not readable.");
    }

    const [receiptItemRows, shipmentRows, packageRows, addressRows, tripRows, documentRows, profileRows, batchShipmentRows, auditRows, statusEventRows] = await Promise.all([
      optionalRows(client, "hub_inbound_receipt_items", "id, receipt_id, shipment_id, tracking_code, status, condition_note, photo_paths, scanned_at"),
      rows(client, "shipments", "id, tracking_code, sender_id, status, origin_city, destination_city, destination_country, digital_twin"),
      optionalRows(client, "shipment_packages", "shipment_id, category, title, description, weight_kg, length_cm, width_cm, height_cm, declared_value_cents, fragile"),
      optionalRows(client, "shipment_addresses", "shipment_id, type, contact_name"),
      optionalRows(client, "trips", "id, traveler_id, origin_city, origin_country, destination_city, destination_country, departure_date, arrival_date, available_weight_kg, status"),
      optionalRows(client, "traveler_documents", "trip_id, traveler_id, departure_airport, arrival_airport, status"),
      optionalRows(client, "profiles", "id, full_name, email, kyc_status"),
      optionalRows(client, "hub_batch_shipments", "batch_id, shipment_id, reserved_weight_kg, status, removed_at"),
      optionalRows(client, "audit_log_events", "id, actor_id, action, entity_type, entity_id, metadata, created_at"),
      optionalRows(client, "shipment_status_events", "id, shipment_id, status, note, created_at"),
    ]);

    const receiptIds = new Set(receiptRows.map((row) => text(row, "id")));
    const currentReceiptItems = receiptItemRows.filter((row) => receiptIds.has(text(row, "receipt_id")));
    const batchIds = new Set(batchRows.map((row) => text(row, "id")));
    const currentBatchShipments = batchShipmentRows.filter((row) => batchIds.has(text(row, "batch_id")));
    const relevantShipmentIds = new Set([
      ...inventoryRows.map((row) => text(row, "shipment_id")),
      ...currentReceiptItems.map((row) => text(row, "shipment_id")),
      ...currentBatchShipments.map((row) => text(row, "shipment_id")),
      ...incidentRows.map((row) => text(row, "shipment_id")),
    ].filter(Boolean));
    const profiles = new Map(profileRows.map((row) => [text(row, "id"), text(row, "full_name", text(row, "email", "Operateur"))]));
    const packages = new Map(packageRows.map((row) => [text(row, "shipment_id"), row]));
    const recipients = new Map(addressRows.filter((row) => text(row, "type") === "recipient").map((row) => [text(row, "shipment_id"), text(row, "contact_name", "Destinataire")]));
    const inventoryByShipment = new Map(inventoryRows.map((row) => [text(row, "shipment_id"), row]));
    const shipments = shipmentRows.filter((row) => relevantShipmentIds.has(text(row, "id"))).map((row) => {
      const id = text(row, "id");
      const parcel = packages.get(id) ?? {};
      const inventory = inventoryByShipment.get(id);
      const digitalTwin = metadata(row, "digital_twin");

      return {
        category: text(parcel, "category", "other"),
        declaredContent: text(parcel, "description", text(parcel, "title", "Colis")),
        declaredValueCents: number(parcel, "declared_value_cents"),
        declaredWeightKg: number(parcel, "weight_kg", number(inventory ?? {}, "measured_weight_kg", 1)),
        destinationCity: text(row, "destination_city", text(inventory ?? {}, "destination_city")),
        destinationCountry: text(row, "destination_country", text(inventory ?? {}, "destination_country")),
        dimensionsCm: { height: number(parcel, "height_cm"), length: number(parcel, "length_cm"), width: number(parcel, "width_cm") },
        fragile: boolean(parcel, "fragile"),
        id,
        originCity: text(row, "origin_city"),
        priority: priority(text(inventory ?? {}, "priority", text(digitalTwin, "priority", "medium"))),
        recipientName: recipients.get(id) ?? "Destinataire",
        senderName: profiles.get(text(row, "sender_id")) ?? "Expediteur",
        status: shipmentStatus(text(row, "status")),
        trackingCode: text(row, "tracking_code"),
      };
    });
    const shipmentMap = new Map(shipments.map((shipment) => [shipment.id, shipment]));
    const zones = new Map(zoneRows.map((row) => [text(row, "id"), row]));
    const aisles = new Map(aisleRows.map((row) => [text(row, "id"), row]));
    const shelves = new Map(shelfRows.map((row) => [text(row, "id"), row]));
    const occupiedByLocation = new Map<string, number>();

    for (const item of inventoryRows) {
      const locationId = text(item, "location_id");
      occupiedByLocation.set(locationId, (occupiedByLocation.get(locationId) ?? 0) + number(item, "measured_weight_kg"));
    }

    const documents = new Map(documentRows.map((row) => [text(row, "trip_id"), row]));
    const hub = hubRows[0];
    const relevantTripIds = new Set(batchRows.map((row) => text(row, "trip_id")).filter(Boolean));
    const currentTrips = tripRows.filter((row) => {
      const document = documents.get(text(row, "id"));

      return relevantTripIds.has(text(row, "id")) || text(document ?? {}, "departure_airport") === text(hub, "airport_code") || text(row, "origin_city").toLowerCase() === text(hub, "city").toLowerCase();
    });
    const reservedByTrip = new Map<string, number>();

    for (const batch of batchRows) {
      const tripId = text(batch, "trip_id");
      reservedByTrip.set(tripId, (reservedByTrip.get(tripId) ?? 0) + number(batch, "reserved_weight_kg"));
    }

    const state: HubState = {
      hubs: hubRows.map((row) => ({ id: text(row, "id"), code: text(row, "code"), name: text(row, "name"), country: text(row, "country"), city: text(row, "city"), airportCode: text(row, "airport_code"), timezone: text(row, "timezone", "UTC") })),
      shipments,
      manifests: receiptRows.map((row) => ({
        arrivedAt: text(row, "received_at", text(row, "created_at")),
        collectionDriver: "Collecte Yobalelma",
        collectionVehicle: text(row, "receipt_code"),
        hubId: text(row, "hub_id"),
        id: text(row, "id"),
        relayStops: [],
        sealedBy: "Controle Hub",
        status: oneOf(text(row, "status"), ["open", "scanning", "needs_review", "confirmed", "closed"] as const, text(row, "status") === "completed" ? "closed" : "open"),
        items: currentReceiptItems.filter((item) => text(item, "receipt_id") === text(row, "id")).map((item) => {
          const shipment = shipmentMap.get(text(item, "shipment_id"));
          return { conditionNote: nullableText(item, "condition_note"), destinationCity: shipment?.destinationCity ?? "", destinationCountry: shipment?.destinationCountry ?? "", photoCount: strings(item, "photo_paths").length, shipmentId: text(item, "shipment_id"), status: inboundStatus(text(item, "status")), trackingCode: text(item, "tracking_code", shipment?.trackingCode), weightKg: shipment?.declaredWeightKg ?? 0 };
        }),
      })),
      inventory: inventoryRows.map((row) => ({ active: boolean(row, "active", true), enteredAt: text(row, "entered_at"), id: text(row, "id"), lastMovementAt: text(row, "last_movement_at"), locationId: text(row, "location_id"), measuredWeightKg: number(row, "measured_weight_kg"), shipmentId: text(row, "shipment_id"), status: inventoryStatus(text(row, "status")) })),
      storageLocations: locationRows.map((row) => {
        const zone = zones.get(text(row, "zone_id")) ?? {};
        const aisle = aisles.get(text(row, "aisle_id")) ?? {};
        const shelf = shelves.get(text(row, "shelf_id")) ?? {};
        return { aisle: text(aisle, "code", "-"), code: text(row, "code"), hubId: text(row, "hub_id"), id: text(row, "id"), maxWeightKg: number(row, "max_weight_kg", number(shelf, "max_weight_kg")), occupiedWeightKg: occupiedByLocation.get(text(row, "id")) ?? 0, shelf: text(shelf, "code", "-"), type: locationType(text(zone, "zone_type", text(row, "location_type"))), zone: text(zone, "name", text(zone, "code", "Stockage")) };
      }),
      inspections: inspectionRows.map((row) => ({ agent: "Operateur Hub", declaredWeightKg: number(row, "declared_weight_kg"), decision: oneOf(text(row, "decision"), ["approved", "repackaging_required", "customer_confirmation_required", "blocked", "rejected", "quarantined"] as const, text(row, "decision") === "needs_repackaging" ? "repackaging_required" : text(row, "decision") === "needs_customer_confirmation" ? "customer_confirmation_required" : "blocked"), inspectedAt: text(row, "inspected_at"), measuredWeightKg: number(row, "measured_weight_kg"), note: text(row, "note"), packageCondition: text(row, "package_condition"), packagingQuality: boolean(row, "packaging_compliant", true) ? "acceptable" : "non_compliant", riskLevel: Math.abs(number(row, "weight_variance_percent")) >= 15 ? "critical" : Math.abs(number(row, "weight_variance_percent")) >= 5 ? "high" : "medium", shipmentId: text(row, "shipment_id"), variancePercent: number(row, "weight_variance_percent") })),
      trips: currentTrips.map((row) => {
        const document = documents.get(text(row, "id")) ?? {};
        return { airline: text(document, "airline", "Compagnie a confirmer"), arrivalAirport: text(document, "arrival_airport"), arrivalCity: text(row, "destination_city"), arrivalCountry: text(row, "destination_country"), capacityKg: number(row, "available_weight_kg"), departureAirport: text(document, "departure_airport"), departureAt: text(row, "departure_date"), flightNumber: text(document, "flight_number", "A confirmer"), id: text(row, "id"), kycStatus: "verified", reservedKg: reservedByTrip.get(text(row, "id")) ?? 0, status: oneOf(text(row, "status"), ["validated", "boarding", "cancelled", "completed"] as const, text(row, "status") === "cancelled" ? "cancelled" : "validated"), travelerId: text(row, "traveler_id"), travelerName: profiles.get(text(row, "traveler_id")) ?? "Voyageur" };
      }),
      batches: batchRows.map((row) => ({ batchCode: text(row, "code"), capacityReservedKg: number(row, "reserved_weight_kg"), destinationCity: text(row, "destination_city"), destinationCountry: text(row, "destination_country"), handoverDeadlineAt: text(row, "handover_deadline_at", text(row, "departure_date")), hubId: text(row, "hub_id"), id: text(row, "id"), locationId: text(row, "preparation_location_id"), shipmentIds: currentBatchShipments.filter((item) => text(item, "batch_id") === text(row, "id") && !item.removed_at).map((item) => text(item, "shipment_id")), status: batchStatus(text(row, "status")), totalWeightKg: number(row, "reserved_weight_kg"), travelerId: text(row, "traveler_id"), tripId: text(row, "trip_id"), validatedBy: profiles.get(text(row, "validated_by")) })),
      anomalies: incidentRows.map((row) => ({ assignedTo: profiles.get(text(row, "assigned_to")), batchId: nullableText(row, "batch_id"), blocksBatch: boolean(row, "blocks_batch"), blocksPayout: boolean(row, "blocks_payout"), blocksShipment: boolean(row, "blocks_shipment"), createdAt: text(row, "created_at"), description: text(row, "description"), hubId: text(row, "hub_id"), id: text(row, "id"), photoCount: strings(row, "photo_paths").length, priority: priority(text(row, "priority")), shipmentId: nullableText(row, "shipment_id"), status: oneOf(text(row, "status"), ["open", "assigned", "escalated", "blocked", "resolved", "closed"] as const, "open") as AnomalyStatus, title: text(row, "title"), type: oneOf(text(row, "incident_type"), ["missing_package", "extra_package", "damaged_package", "wrong_weight", "wrong_dimensions", "prohibited_item", "packaging_issue", "wrong_destination", "traveler_cancelled", "flight_changed", "capacity_mismatch", "qr_issue", "storage_issue", "manifest_mismatch"] as const, "manifest_mismatch") as AnomalyType })),
      auditEvents: auditRows.map((row) => ({ action: text(row, "action"), actor: profiles.get(text(row, "actor_id")) ?? "Systeme", at: text(row, "created_at"), entityId: text(row, "entity_id"), entityType: text(row, "entity_type"), id: text(row, "id"), metadata: Object.fromEntries(Object.entries(metadata(row)).filter((entry): entry is [string, string | number | boolean | null] => entry[1] === null || ["string", "number", "boolean"].includes(typeof entry[1]))) })),
      trackingEvents: statusEventRows.filter((row) => relevantShipmentIds.has(text(row, "shipment_id"))).map((row) => ({ at: text(row, "created_at"), id: text(row, "id"), note: text(row, "note"), shipmentId: text(row, "shipment_id"), status: shipmentStatus(text(row, "status")) })),
      notifications: notificationRows.map((row) => ({ at: text(row, "created_at"), id: text(row, "id"), message: text(row, "body"), priority: priority(text(metadata(row), "priority", "medium")), read: Boolean(row.read_at), title: text(row, "title") })),
      reports: [],
    };

    const totalInventory = state.inventory.filter((item) => item.active).length;
    state.reports = [
      { label: "Colis au Hub", trend: "temps reel", unit: "colis", value: totalInventory },
      { label: "Anomalies ouvertes", trend: "temps reel", unit: "cas", value: state.anomalies.filter((item) => !["resolved", "closed"].includes(item.status)).length },
      { label: "Lots actifs", trend: "temps reel", unit: "lots", value: state.batches.filter((item) => !["completed", "cancelled"].includes(item.status)).length },
      { label: "Capacite reservee", trend: "temps reel", unit: "kg", value: state.batches.reduce((sum, item) => sum + item.capacityReservedKg, 0) },
    ];

    return state;
  } catch (error) {
    throw new Error("Unable to load the authenticated Hub read model.", { cause: error });
  }
}
