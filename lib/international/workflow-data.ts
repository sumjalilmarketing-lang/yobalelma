import "server-only";

import type { PlatformRole } from "@/lib/auth/roles";
import {
  internationalWorkflowSteps,
  stepProgressForStatus,
  workspaceForRole,
  type InternationalRoleWorkspace,
} from "@/lib/international/status-machine";
import { tryCreateSupabaseServerClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database.types";

type Tables = Database["public"]["Tables"];
type ShipmentRow = Tables["shipments"]["Row"];
type ShipmentEventRow = Tables["shipment_status_events"]["Row"];
type RelayInventoryRow = Tables["relay_inventory"]["Row"];
type CollectionRouteRow = Tables["collection_routes"]["Row"];
type CollectionManifestRow = Tables["collection_manifests"]["Row"];
type CollectionManifestItemRow = Tables["collection_manifest_items"]["Row"];
type HubBatchRow = Tables["hub_batches"]["Row"];
type CapacityReservationRow = Tables["capacity_reservations"]["Row"];
type HandoverQrTokenRow = Tables["handover_qr_tokens"]["Row"];
type NotificationRow = Tables["notifications"]["Row"];
type TripRow = Tables["trips"]["Row"];

export type InternationalShipmentSummary = Pick<
  ShipmentRow,
  | "created_at"
  | "currency"
  | "destination_city"
  | "destination_country"
  | "estimated_price_cents"
  | "fulfillment_method"
  | "id"
  | "origin_city"
  | "origin_country"
  | "scope"
  | "sender_id"
  | "status"
  | "tracking_code"
>;

export type InternationalWorkflowData =
  | { status: "needs-env"; workspace: InternationalRoleWorkspace }
  | {
      status: "ready";
      workspace: InternationalRoleWorkspace;
      loadedAt: string;
      metrics: Array<{ label: string; value: number; description: string }>;
      shipments: InternationalShipmentSummary[];
      events: ShipmentEventRow[];
      relayInventory: RelayInventoryRow[];
      collectionRoutes: CollectionRouteRow[];
      collectionManifests: CollectionManifestRow[];
      collectionManifestItems: CollectionManifestItemRow[];
      hubBatches: HubBatchRow[];
      capacityReservations: CapacityReservationRow[];
      qrTokens: HandoverQrTokenRow[];
      notifications: NotificationRow[];
      trips: TripRow[];
      warnings: string[];
    };

export async function loadInternationalWorkflowData({
  role,
  userId,
}: {
  role: PlatformRole;
  userId: string;
}): Promise<InternationalWorkflowData> {
  const workspace = workspaceForRole(role);
  const supabase = await tryCreateSupabaseServerClient();

  if (!supabase) {
    return { status: "needs-env", workspace };
  }

  const client = supabase;
  const warnings: string[] = [];

  const shipmentQuery = client
    .from("shipments")
    .select(
      "id, tracking_code, scope, status, origin_city, origin_country, destination_city, destination_country, fulfillment_method, estimated_price_cents, currency, sender_id, created_at",
    )
    .eq("scope", "international")
    .order("created_at", { ascending: false })
    .limit(12);

  if (workspace === "client") {
    shipmentQuery.eq("sender_id", userId);
  }

  const [
    shipmentsResult,
    relayInventoryResult,
    collectionRoutesResult,
    collectionManifestsResult,
    collectionManifestItemsResult,
    hubBatchesResult,
    capacityReservationsResult,
    qrTokensResult,
    notificationsResult,
    tripsResult,
  ] = await Promise.all([
    shipmentQuery,
    client
      .from("relay_inventory")
      .select("id, shipment_id, current_relay_point_id, status, checked_in_at, checked_out_at, created_at, updated_at, updated_by")
      .order("updated_at", { ascending: false })
      .limit(12),
    client
      .from("collection_routes")
      .select("id, name, route_date, status, driver_id, created_by, created_at, updated_at")
      .order("route_date", { ascending: false })
      .limit(8),
    client
      .from("collection_manifests")
      .select("id, code, route_id, sealed_at, sealed_by, delivered_to_hub_at, incident_note, created_at, updated_at")
      .order("created_at", { ascending: false })
      .limit(8),
    client
      .from("collection_manifest_items")
      .select("id, manifest_id, shipment_id, scanned_at, incident_note, created_at")
      .order("scanned_at", { ascending: false })
      .limit(20),
    client
      .from("hub_batches")
      .select(
        "id, code, status, origin_hub, destination_hub, destination_city, destination_country, capacity_kg, reserved_weight_kg, anomaly_count, traveler_id, trip_id, departure_date, flight_number, created_at, updated_at",
      )
      .order("created_at", { ascending: false })
      .limit(10),
    client
      .from("capacity_reservations")
      .select("id, batch_id, shipment_id, reserved_weight_kg, status, created_by, created_at, updated_at")
      .order("created_at", { ascending: false })
      .limit(20),
    client
      .from("handover_qr_tokens")
      .select("id, batch_id, token_type, status, traveler_id, trip_id, created_at, updated_at, expires_at, used_at, used_by, revoked_at, created_by, metadata")
      .order("created_at", { ascending: false })
      .limit(12),
    client
      .from("notifications")
      .select("id, title, body, type, status, channel, action_url, shipment_id, recipient_id, actor_id, created_at, updated_at, sent_at, read_at, scheduled_for, metadata")
      .eq("recipient_id", userId)
      .order("created_at", { ascending: false })
      .limit(8),
    client
      .from("trips")
      .select("id, origin_city, origin_country, destination_city, destination_country, departure_date, arrival_date, available_weight_kg, traveler_id, status, created_at, updated_at")
      .order("departure_date", { ascending: true })
      .limit(8),
  ]);

  const shipments = collectResult(
    shipmentsResult,
    "Expeditions internationales",
    warnings,
  ) as InternationalShipmentSummary[];

  const shipmentIds = shipments.map((shipment) => shipment.id);
  const events = shipmentIds.length
    ? await loadShipmentEvents(shipmentIds, warnings)
    : [];

  const relayInventory = collectResult(relayInventoryResult, "Inventaire relais", warnings) as RelayInventoryRow[];
  const collectionRoutes = collectResult(collectionRoutesResult, "Tournees collecte", warnings) as CollectionRouteRow[];
  const collectionManifests = collectResult(collectionManifestsResult, "Manifestes collecte", warnings) as CollectionManifestRow[];
  const collectionManifestItems = collectResult(
    collectionManifestItemsResult,
    "Items manifeste collecte",
    warnings,
  ) as CollectionManifestItemRow[];
  const hubBatches = collectResult(hubBatchesResult, "Lots hub", warnings) as HubBatchRow[];
  const capacityReservations = collectResult(
    capacityReservationsResult,
    "Reservations capacite",
    warnings,
  ) as CapacityReservationRow[];
  const qrTokens = collectResult(qrTokensResult, "QR handover", warnings) as HandoverQrTokenRow[];
  const notifications = collectResult(notificationsResult, "Notifications", warnings) as NotificationRow[];
  const trips = collectResult(tripsResult, "Voyages", warnings) as TripRow[];

  return {
    status: "ready",
    workspace,
    loadedAt: new Date().toISOString(),
    metrics: buildInternationalMetrics({
      capacityReservations,
      collectionManifests,
      collectionRoutes,
      hubBatches,
      qrTokens,
      relayInventory,
      shipments,
      trips,
    }),
    shipments,
    events,
    relayInventory,
    collectionRoutes,
    collectionManifests,
    collectionManifestItems,
    hubBatches,
    capacityReservations,
    qrTokens,
    notifications,
    trips,
    warnings,
  };

  async function loadShipmentEvents(ids: string[], warningBag: string[]) {
    const result = await client
      .from("shipment_status_events")
      .select("id, shipment_id, status, note, metadata, actor_id, created_at")
      .in("shipment_id", ids)
      .order("created_at", { ascending: false })
      .limit(40);

    return collectResult(result, "Evenements shipment", warningBag) as ShipmentEventRow[];
  }
}

function collectResult<T>(
  result: { data: T[] | null; error: { message: string } | null },
  label: string,
  warnings: string[],
) {
  if (result.error) {
    warnings.push(`${label}: ${result.error.message}`);
    return [];
  }

  return result.data ?? [];
}

function buildInternationalMetrics({
  capacityReservations,
  collectionManifests,
  collectionRoutes,
  hubBatches,
  qrTokens,
  relayInventory,
  shipments,
  trips,
}: {
  capacityReservations: CapacityReservationRow[];
  collectionManifests: CollectionManifestRow[];
  collectionRoutes: CollectionRouteRow[];
  hubBatches: HubBatchRow[];
  qrTokens: HandoverQrTokenRow[];
  relayInventory: RelayInventoryRow[];
  shipments: InternationalShipmentSummary[];
  trips: TripRow[];
}) {
  const activeQr = qrTokens.filter((token) => token.status === "active").length;
  const activeBatches = hubBatches.filter((batch) =>
    ["open", "sealed", "in_transit", "arrived"].includes(batch.status),
  ).length;

  return [
    {
      label: "Expeditions internationales",
      value: shipments.length,
      description: "Derniers envois internationaux visibles pour ce role.",
    },
    {
      label: "Stock relais",
      value: relayInventory.filter((item) => item.status === "stored").length,
      description: "Colis actuellement stockes dans le reseau relais visible.",
    },
    {
      label: "Tournees actives",
      value: collectionRoutes.filter((route) => route.status !== "completed").length,
      description: "Collectes relais vers hub non terminees.",
    },
    {
      label: "Manifestes",
      value: collectionManifests.length,
      description: "Manifestes recents scelles ou en route vers le hub.",
    },
    {
      label: "Lots hub actifs",
      value: activeBatches,
      description: "Lots hub ouverts, scelles, en transit ou arrives.",
    },
    {
      label: "Reservations capacite",
      value: capacityReservations.length,
      description: "Reservations recentes reliant colis et lots.",
    },
    {
      label: "QR actifs",
      value: activeQr,
      description: "QR retrait ou destination non consommes.",
    },
    {
      label: "Voyages visibles",
      value: trips.length,
      description: "Trajets voyageurs visibles par les policies Supabase.",
    },
  ];
}

export function buildShipmentProgressRows(
  shipments: InternationalShipmentSummary[],
  events: ShipmentEventRow[],
) {
  return shipments.map((shipment) => {
    const progress = stepProgressForStatus(shipment.status);
    const lastEvent = events.find((event) => event.shipment_id === shipment.id);

    return {
      currentLabel: progress.currentStep.label,
      nextLabel: progress.nextStep?.label ?? "Flux termine ou en attente de validation manuelle",
      percent: Math.round((progress.completed / progress.total) * 100),
      shipment,
      lastEvent,
    };
  });
}

export function internationalStepSummary(events: ShipmentEventRow[]) {
  return internationalWorkflowSteps.map((step) => {
    const matchingEvents = events.filter((event) => step.mappedStatuses.includes(event.status));

    return {
      ...step,
      count: matchingEvents.length,
      lastEvent: matchingEvents[0] ?? null,
    };
  });
}
