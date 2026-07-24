import { randomUUID } from "node:crypto";
import {
  assertCapacityReservation,
  assertHandoverChecks,
  evaluateWeightTolerance,
  summarizeManifest,
  type ManifestItemStatus,
} from "@/lib/hub/workflows";
import type {
  Anomaly,
  AnomalyType,
  AuditEvent,
  BatchStatus,
  Hub,
  HubBatch,
  HubDashboardSnapshot,
  HubNotification,
  HubReport,
  HubSession,
  InboundManifestItem,
  InboundItemStatus,
  InboundManifest,
  Inspection,
  InspectionDecision,
  InventoryItem,
  InventoryStatus,
  PickupQrToken,
  Priority,
  Shipment,
  ShipmentStatus,
  StorageLocation,
  TravelerTrip,
  TrackingEvent,
} from "./types";

export type HubState = {
  anomalies: Anomaly[];
  auditEvents: AuditEvent[];
  batches: HubBatch[];
  hubs: Hub[];
  inspections: Inspection[];
  inventory: InventoryItem[];
  manifests: InboundManifest[];
  notifications: HubNotification[];
  reports: HubReport[];
  shipments: Shipment[];
  storageLocations: StorageLocation[];
  trackingEvents: TrackingEvent[];
  trips: TravelerTrip[];
};

declare global {
  var __yobalelmaHubState: HubState | undefined;
}

const now = () => new Date().toISOString();
const hoursFromNow = (hours: number) => new Date(Date.now() + hours * 60 * 60 * 1000).toISOString();

function createInitialState(): HubState {
  const hubs: Hub[] = [
    {
      airportCode: "DSS",
      city: "Dakar",
      code: "DSS-DAKAR",
      country: "Senegal",
      id: "hub-dss",
      name: "Dakar DSS Hub",
      timezone: "Africa/Dakar",
    },
    {
      airportCode: "CDG",
      city: "Paris",
      code: "CDG-PARIS",
      country: "France",
      id: "hub-cdg",
      name: "Paris CDG Hub",
      timezone: "Europe/Paris",
    },
  ];

  const shipments: Shipment[] = [
    shipment("shp-001", "YBL-DSS-CDG-001", "Paris", "France", 4.2, "Mode", "Awa Ndiaye", "Claire Martin", "high"),
    shipment("shp-002", "YBL-DSS-CDG-002", "Paris", "France", 6.4, "Documents", "Ousmane Ba", "Julien Bernard", "medium"),
    shipment("shp-003", "YBL-DSS-BRU-003", "Bruxelles", "Belgique", 3.1, "Artisanat", "Fatou Kane", "Amadou Diallo", "medium"),
    shipment("shp-004", "YBL-DSS-ABJ-004", "Abidjan", "Cote d'Ivoire", 8.8, "Electronique", "Moussa Fall", "Aminata Coulibaly", "urgent"),
    shipment("shp-005", "YBL-DSS-CMN-005", "Casablanca", "Maroc", 5.7, "Textile", "Mame Diouf", "Youssef Amrani", "low"),
    shipment("shp-006", "YBL-DSS-CDG-006", "Paris", "France", 7.5, "Cosmetiques", "Ndeye Sarr", "Mariam Sow", "high"),
  ];

  const storageLocations: StorageLocation[] = [
    location("loc-reception-01", "hub-dss", "REC-A1", "Reception", "A", "01", "R1", "reception", 300, 42),
    location("loc-inspection-01", "hub-dss", "INS-B1", "Inspection", "B", "02", "I1", "inspection", 180, 18),
    location("loc-storage-01", "hub-dss", "STO-C1", "Stockage France", "C", "05", "S1", "storage", 550, 146),
    location("loc-storage-02", "hub-dss", "STO-C2", "Stockage Afrique", "C", "06", "S2", "storage", 550, 83),
    location("loc-quarantine-01", "hub-dss", "QUA-Q1", "Quarantaine", "Q", "01", "Q1", "quarantine", 120, 11),
    location("loc-prep-01", "hub-dss", "PRE-P1", "Preparation lots", "P", "03", "P1", "preparation", 220, 24),
  ];

  const manifests: InboundManifest[] = [
    {
      arrivedAt: hoursFromNow(-1.6),
      collectionDriver: "Ibrahima Diagne",
      collectionVehicle: "DK-7821-AC",
      hubId: "hub-dss",
      id: "manifest-dss-001",
      relayStops: [
        { expectedPackages: 3, receivedPackages: 2, relayCode: "RLY-DKR-PLT", relayName: "Plateau" },
        { expectedPackages: 2, receivedPackages: 2, relayCode: "RLY-DKR-ALM", relayName: "Almadies" },
      ],
      sealedBy: "Relay supervisor",
      status: "scanning",
      items: [
        manifestItem(shipments[0], "received_at_hub", "Scanne au quai 2."),
        manifestItem(shipments[1], "received_at_hub", "Scanne au quai 2."),
        manifestItem(shipments[2], "expected_at_hub"),
        manifestItem(shipments[3], "damaged_at_hub", "Angle gauche ecrase, photo jointe.", 2),
        manifestItem(shipments[4], "missing_at_hub", "Absent du bac Almadies, chauffeur notifie."),
      ],
    },
    {
      arrivedAt: hoursFromNow(2.3),
      collectionDriver: "Cheikh Mbaye",
      collectionVehicle: "DK-2219-BD",
      hubId: "hub-dss",
      id: "manifest-dss-002",
      relayStops: [{ expectedPackages: 1, receivedPackages: 0, relayCode: "RLY-THS-CTR", relayName: "Thies centre" }],
      sealedBy: "Collection control",
      status: "open",
      items: [manifestItem(shipments[5], "expected_at_hub")],
    },
  ];

  const inventory: InventoryItem[] = [
    inventoryItem("inv-001", "shp-001", "loc-inspection-01", 4.3, "inspection_required"),
    inventoryItem("inv-002", "shp-002", "loc-storage-01", 6.4, "in_storage"),
    inventoryItem("inv-004", "shp-004", "loc-quarantine-01", 9.7, "damaged"),
  ];

  const trips: TravelerTrip[] = [
    {
      airline: "Air Senegal",
      arrivalAirport: "CDG",
      arrivalCity: "Paris",
      arrivalCountry: "France",
      capacityKg: 35,
      departureAirport: "DSS",
      departureAt: hoursFromNow(9),
      flightNumber: "HC403",
      id: "trip-cdg-001",
      kycStatus: "verified",
      reservedKg: 6.4,
      status: "validated",
      travelerId: "traveler-001",
      travelerName: "Mamadou Ba",
    },
    {
      airline: "Air Cote d'Ivoire",
      arrivalAirport: "ABJ",
      arrivalCity: "Abidjan",
      arrivalCountry: "Cote d'Ivoire",
      capacityKg: 28,
      departureAirport: "DSS",
      departureAt: hoursFromNow(13),
      flightNumber: "HF701",
      id: "trip-abj-001",
      kycStatus: "verified",
      reservedKg: 0,
      status: "validated",
      travelerId: "traveler-002",
      travelerName: "Aminata Kone",
    },
  ];

  const batches: HubBatch[] = [
    {
      batchCode: "HUB-CDG-2407-A",
      capacityReservedKg: 6.4,
      destinationCity: "Paris",
      destinationCountry: "France",
      handoverDeadlineAt: hoursFromNow(6),
      hubId: "hub-dss",
      id: "batch-cdg-001",
      locationId: "loc-prep-01",
      shipmentIds: ["shp-002"],
      status: "ready",
      totalWeightKg: 6.4,
      travelerId: "traveler-001",
      tripId: "trip-cdg-001",
      validatedBy: "Mamadou Sarr",
    },
  ];

  const anomalies: Anomaly[] = [
    {
      blocksBatch: false,
      blocksPayout: false,
      blocksShipment: true,
      createdAt: hoursFromNow(-1.1),
      description: "Le colis est absent de la caisse remise par le relais Almadies.",
      hubId: "hub-dss",
      id: "anom-001",
      photoCount: 0,
      priority: "urgent",
      shipmentId: "shp-005",
      status: "assigned",
      title: "Colis manquant au Hub",
      type: "missing_package",
    },
    {
      blocksBatch: true,
      blocksPayout: true,
      blocksShipment: true,
      createdAt: hoursFromNow(-0.8),
      description: "Emballage endommage avant inspection approfondie.",
      hubId: "hub-dss",
      id: "anom-002",
      photoCount: 2,
      priority: "high",
      shipmentId: "shp-004",
      status: "open",
      title: "Colis endommage",
      type: "damaged_package",
    },
  ];

  const auditEvents: AuditEvent[] = [
    audit("hub_manifest_opened", "manifest", "manifest-dss-001", "Awa Diop", { vehicle: "DK-7821-AC" }),
    audit("hub_inventory_moved", "shipment", "shp-002", "Awa Diop", { location: "STO-C1" }),
    audit("hub_batch_validated", "hub_batch", "batch-cdg-001", "Mamadou Sarr", { batch: "HUB-CDG-2407-A" }),
  ];

  const trackingEvents: TrackingEvent[] = [
    tracking("shp-001", "at_hub", "Colis recu au hub Dakar."),
    tracking("shp-002", "in_storage", "Colis stocke zone France."),
    tracking("shp-004", "damaged_at_hub", "Anomalie declaree pendant la reception."),
  ];

  const notifications: HubNotification[] = [
    notification("Remise a preparer", "Le lot HUB-CDG-2407-A doit etre remis avant le depart HC403.", "high"),
    notification("Ecart manifeste", "Deux ecarts sont ouverts sur la reception DSS-001.", "urgent"),
    notification("Capacite disponible", "28.6 kg restent disponibles vers Paris aujourd'hui.", "medium"),
  ];

  const inspections: Inspection[] = [
    {
      agent: "Awa Diop",
      declaredWeightKg: 4.2,
      decision: "customer_confirmation_required",
      inspectedAt: hoursFromNow(-0.4),
      measuredWeightKg: 4.3,
      note: "Legere difference, emballage conforme.",
      packageCondition: "bon",
      packagingQuality: "acceptable",
      riskLevel: "medium",
      shipmentId: "shp-001",
      variancePercent: 2.38,
    },
  ];

  const reports: HubReport[] = [
    { label: "Colis traites", trend: "+12%", unit: "colis", value: 126 },
    { label: "Temps reception moyen", trend: "-8%", unit: "min", value: 11 },
    { label: "Anomalies ouvertes", trend: "+2", unit: "cas", value: anomalies.length },
    { label: "Capacite utilisee", trend: "stable", unit: "%", value: 18 },
  ];

  return {
    anomalies,
    auditEvents,
    batches,
    hubs,
    inspections,
    inventory,
    manifests,
    notifications,
    reports,
    shipments,
    storageLocations,
    trackingEvents,
    trips,
  };
}

function shipment(
  id: string,
  trackingCode: string,
  destinationCity: string,
  destinationCountry: string,
  declaredWeightKg: number,
  category: string,
  senderName: string,
  recipientName: string,
  priority: Priority,
): Shipment {
  return {
    category,
    declaredContent: category,
    declaredValueCents: Math.round(declaredWeightKg * 6500),
    declaredWeightKg,
    destinationCity,
    destinationCountry,
    dimensionsCm: { height: 18, length: 38, width: 24 },
    fragile: category === "Electronique" || category === "Artisanat",
    id,
    originCity: "Dakar",
    priority,
    recipientName,
    senderName,
    status: "expected_at_hub",
    trackingCode,
  };
}

function location(
  id: string,
  hubId: string,
  code: string,
  zone: string,
  aisle: string,
  shelf: string,
  rack: string,
  type: StorageLocation["type"],
  maxWeightKg: number,
  occupiedWeightKg: number,
): StorageLocation {
  return {
    aisle,
    code,
    hubId,
    id,
    maxWeightKg,
    occupiedWeightKg,
    shelf: `${shelf}-${rack}`,
    type,
    zone,
  };
}

function manifestItem(
  shipment: Shipment,
  status: InboundItemStatus,
  conditionNote = "",
  photoCount = 0,
): InboundManifestItem {
  shipment.status =
    status === "received_at_hub"
      ? "inspection_required"
      : status === "damaged_at_hub"
        ? "damaged_at_hub"
        : status === "missing_at_hub"
          ? "missing_at_hub"
          : "expected_at_hub";

  return {
    conditionNote,
    destinationCity: shipment.destinationCity,
    destinationCountry: shipment.destinationCountry,
    photoCount,
    shipmentId: shipment.id,
    status,
    trackingCode: shipment.trackingCode,
    weightKg: shipment.declaredWeightKg,
  };
}

function inventoryItem(
  id: string,
  shipmentId: string,
  locationId: string,
  measuredWeightKg: number,
  status: InventoryStatus,
): InventoryItem {
  return {
    active: true,
    enteredAt: hoursFromNow(-1),
    id,
    lastMovementAt: hoursFromNow(-0.2),
    locationId,
    measuredWeightKg,
    shipmentId,
    status,
  };
}

function audit(
  action: string,
  entityType: string,
  entityId: string,
  actor: string,
  metadata: AuditEvent["metadata"],
): AuditEvent {
  return {
    action,
    actor,
    at: now(),
    entityId,
    entityType,
    id: `audit-${randomUUID()}`,
    metadata,
  };
}

function tracking(
  shipmentId: string,
  status: TrackingEvent["status"],
  note: string,
): TrackingEvent {
  return {
    at: now(),
    id: `track-${randomUUID()}`,
    note,
    shipmentId,
    status,
  };
}

function notification(title: string, message: string, priority: Priority): HubNotification {
  return {
    at: now(),
    id: `notif-${randomUUID()}`,
    message,
    priority,
    read: false,
    title,
  };
}

function state() {
  globalThis.__yobalelmaHubState ??= createInitialState();

  return globalThis.__yobalelmaHubState;
}

export function resetHubState() {
  globalThis.__yobalelmaHubState = createInitialState();

  return getHubSnapshot();
}

export function getHubState() {
  return state();
}

export function getHubSnapshot(store: HubState = state()): HubDashboardSnapshot {
  const activeInventory = store.inventory.filter((item) => item.active);
  const trips = store.trips.filter((trip) => trip.status === "validated" || trip.status === "boarding");
  const capacityTotalKg = trips.reduce((total, trip) => total + trip.capacityKg, 0);
  const capacityReservedKg = store.batches.reduce((total, batch) => total + batch.capacityReservedKg, 0);
  const totalWeightInHubKg = activeInventory.reduce((total, item) => total + item.measuredWeightKg, 0);
  const openAnomalies = store.anomalies.filter((anomaly) => !["closed", "resolved"].includes(anomaly.status));
  const toInspect = activeInventory.filter((item) => item.status === "inspection_required").length;
  const inStorage = activeInventory.filter((item) => item.status === "in_storage").length;

  return {
    alerts: store.notifications.slice(0, 5),
    auditEvents: store.auditEvents.slice(-8).reverse(),
    capacityRemainingKg: Math.max(capacityTotalKg - capacityReservedKg, 0),
    capacityReservedKg,
    capacityTotalKg,
    kpis: [
      { key: "expected", label: "Colis attendus", tone: "info", value: String(countManifestItems(store, ["expected_at_hub"])) },
      { key: "received", label: "Colis recus", tone: "success", value: String(countManifestItems(store, ["received_at_hub"])) },
      { key: "missing", label: "Colis manquants", tone: "danger", value: String(countManifestItems(store, ["missing_at_hub"])) },
      { key: "damaged", label: "Colis endommages", tone: "warning", value: String(countManifestItems(store, ["damaged_at_hub"])) },
      { key: "inspect", label: "A inspecter", tone: "warning", value: String(toInspect) },
      { key: "storage", label: "En stockage", tone: "neutral", value: String(inStorage) },
      { key: "capacity", label: "Capacite restante", tone: "success", value: `${Math.max(capacityTotalKg - capacityReservedKg, 0).toFixed(1)} kg` },
      { key: "anomalies", label: "Anomalies ouvertes", tone: openAnomalies.length > 0 ? "danger" : "success", value: String(openAnomalies.length) },
      { key: "weight", label: "Poids au Hub", tone: "info", value: `${totalWeightInHubKg.toFixed(1)} kg` },
    ],
    priorityTasks: [
      { href: "/hub/inbound/manifest-dss-001", label: "Justifier et fermer le manifeste DSS-001", tone: "warning" },
      { href: "/hub/inspection/shp-004", label: "Inspecter le colis endommage YBL-DSS-ABJ-004", tone: "danger" },
      { href: "/hub/handover/batch-cdg-001", label: "Remettre le lot Paris au voyageur HC403", tone: "info" },
    ],
    processingMinutesAvg: 12,
    reports: store.reports,
    totalWeightInHubKg,
  };
}

function countManifestItems(store: HubState, statuses: InboundItemStatus[]) {
  return store.manifests.flatMap((manifest) => manifest.items).filter((item) => statuses.includes(item.status)).length;
}

export function getManifest(id: string, store: HubState = state()) {
  return store.manifests.find((manifest) => manifest.id === id) ?? null;
}

export function getShipment(id: string, store: HubState = state()) {
  return store.shipments.find((shipment) => shipment.id === id || shipment.trackingCode === id) ?? null;
}

export function getInventoryByShipment(shipmentId: string, store: HubState = state()) {
  return store.inventory.find((item) => item.shipmentId === shipmentId && item.active) ?? null;
}

export function getTrip(id: string, store: HubState = state()) {
  return store.trips.find((trip) => trip.id === id) ?? null;
}

export function getBatch(id: string, store: HubState = state()) {
  return store.batches.find((batch) => batch.id === id || batch.batchCode === id) ?? null;
}

export function getAnomaly(id: string, store: HubState = state()) {
  return store.anomalies.find((anomaly) => anomaly.id === id) ?? null;
}

export function getCompatibleShipments(tripId: string, store: HubState = state()) {
  const trip = getTrip(tripId, store);

  if (!trip) {
    return [];
  }

  const activeBatchShipmentIds = new Set(
    store.batches
      .filter((batch) => !["cancelled", "completed", "disputed"].includes(batch.status))
      .flatMap((batch) => batch.shipmentIds),
  );

  return store.shipments.filter((shipment) => {
    const inventory = getInventoryByShipment(shipment.id, store);

    return (
      shipment.destinationCountry.toLowerCase() === trip.arrivalCountry.toLowerCase() &&
      inventory?.status === "in_storage" &&
      !activeBatchShipmentIds.has(shipment.id)
    );
  });
}

export function scanInboundPackage(input: {
  manifestId: string;
  note?: string;
  photoCount?: number;
  session: HubSession;
  status: InboundItemStatus;
  trackingCode: string;
}) {
  const store = state();
  const manifest = getManifest(input.manifestId);

  if (!manifest) {
    throw new Error("Manifest not found.");
  }

  const item = manifest.items.find((manifestItem) => manifestItem.trackingCode === input.trackingCode);
  const discrepancy = ["missing_at_hub", "extra_at_hub", "damaged_at_hub", "rejected_at_hub", "quarantined_at_hub"].includes(input.status);

  if (discrepancy && !input.note?.trim()) {
    throw new Error("A justified note is required before recording a Hub discrepancy.");
  }

  const shipment = store.shipments.find((candidate) => candidate.trackingCode === input.trackingCode);
  const targetItem =
    item ??
    ({
      conditionNote: "",
      destinationCity: shipment?.destinationCity ?? "Unknown",
      destinationCountry: shipment?.destinationCountry ?? "Unknown",
      photoCount: 0,
      shipmentId: shipment?.id ?? `extra-${randomUUID()}`,
      status: "extra_at_hub",
      trackingCode: input.trackingCode,
      weightKg: shipment?.declaredWeightKg ?? 1,
    } satisfies InboundManifestItem);

  if (!item) {
    manifest.items.push(targetItem);
  }

  targetItem.status = input.status;
  targetItem.conditionNote = input.note?.trim() ?? "";
  targetItem.photoCount = input.photoCount ?? targetItem.photoCount;
  manifest.status = "scanning";

  if (shipment) {
    shipment.status = shipmentStatusFromInbound(input.status);

    if (["received_at_hub", "damaged_at_hub", "quarantined_at_hub"].includes(input.status)) {
      upsertInventory(shipment.id, input.status === "received_at_hub" ? "inspection_required" : input.status === "damaged_at_hub" ? "damaged" : "quarantined");
    }
  }

  if (discrepancy) {
    createAnomalyInternal({
      blocksBatch: input.status !== "extra_at_hub",
      blocksPayout: input.status === "damaged_at_hub" || input.status === "rejected_at_hub",
      blocksShipment: input.status !== "extra_at_hub",
      description: input.note ?? "Ecart de manifeste detecte au Hub.",
      hubId: manifest.hubId,
      photoCount: input.photoCount ?? 0,
      priority: input.status === "missing_at_hub" ? "urgent" : "high",
      shipmentId: shipment?.id,
      title: `Ecart ${input.trackingCode}`,
      type: anomalyFromInboundStatus(input.status),
    });
  }

  store.trackingEvents.push(tracking(targetItem.shipmentId, input.status, input.note || "Scan reception Hub."));
  store.auditEvents.push(audit("hub_inbound_item_scanned", "manifest", manifest.id, input.session.name, { status: input.status, trackingCode: input.trackingCode }));

  return manifest;
}

function shipmentStatusFromInbound(status: InboundItemStatus): ShipmentStatus {
  if (status === "received_at_hub") return "inspection_required";
  if (status === "damaged_at_hub") return "damaged_at_hub";
  if (status === "missing_at_hub") return "missing_at_hub";
  if (status === "quarantined_at_hub") return "quarantined_at_hub";
  return "at_hub";
}

function anomalyFromInboundStatus(status: InboundItemStatus): AnomalyType {
  if (status === "missing_at_hub") return "missing_package";
  if (status === "extra_at_hub") return "extra_package";
  if (status === "damaged_at_hub") return "damaged_package";
  if (status === "quarantined_at_hub") return "manifest_mismatch";
  return "manifest_mismatch";
}

function upsertInventory(shipmentId: string, inventoryStatus: InventoryStatus) {
  const store = state();
  const current = getInventoryByShipment(shipmentId);
  const shipment = getShipment(shipmentId);

  if (!shipment) {
    throw new Error("Shipment not found.");
  }

  if (current) {
    current.status = inventoryStatus;
    current.lastMovementAt = now();
    return current;
  }

  const locationId =
    inventoryStatus === "quarantined" || inventoryStatus === "damaged"
      ? "loc-quarantine-01"
      : inventoryStatus === "inspection_required"
        ? "loc-inspection-01"
        : "loc-storage-01";

  const item = inventoryItem(`inv-${randomUUID()}`, shipment.id, locationId, shipment.declaredWeightKg, inventoryStatus);
  store.inventory.push(item);

  return item;
}

export function confirmInboundManifest(manifestId: string, session: HubSession) {
  const store = state();
  const manifest = getManifest(manifestId);

  if (!manifest) {
    throw new Error("Manifest not found.");
  }

  const summary = summarizeManifest(
    manifest.items.map((item) => ({
      note: item.conditionNote,
      status: toManifestSummaryStatus(item.status),
    })),
  );

  if (!summary.canConfirm) {
    throw new Error("Manifest cannot be closed while discrepancies remain unjustified.");
  }

  manifest.status = summary.missing || summary.damaged || summary.extra || summary.quarantined ? "needs_review" : "confirmed";
  store.auditEvents.push(audit("hub_manifest_confirmed", "manifest", manifest.id, session.name, { received: summary.received, missing: summary.missing }));

  return manifest;
}

function toManifestSummaryStatus(status: InboundItemStatus): ManifestItemStatus {
  if (status === "quarantined_at_hub") return "quarantined";
  if (status === "arrived_at_hub") return "expected_at_hub";

  return status;
}

export function recordInspection(input: {
  decision?: InspectionDecision;
  measuredWeightKg: number;
  note?: string;
  packagingQuality: Inspection["packagingQuality"];
  session: HubSession;
  shipmentId: string;
}) {
  const store = state();
  const shipment = getShipment(input.shipmentId);

  if (!shipment) {
    throw new Error("Shipment not found.");
  }

  const tolerance = evaluateWeightTolerance({
    declaredWeightKg: shipment.declaredWeightKg,
    measuredWeightKg: input.measuredWeightKg,
  });
  const decision =
    input.decision ??
    (tolerance.recommendedDecision === "approved"
      ? "approved"
      : tolerance.recommendedDecision === "blocked"
        ? "blocked"
        : "customer_confirmation_required");
  const riskLevel: Priority = tolerance.tone === "blocked" ? "critical" : tolerance.tone === "alert" ? "high" : "medium";
  const inventoryStatus: InventoryStatus =
    decision === "approved" ? "in_storage" : decision === "rejected" ? "rejected" : decision === "quarantined" || decision === "blocked" ? "quarantined" : "inspection_required";
  const inventory = upsertInventory(shipment.id, inventoryStatus);

  inventory.measuredWeightKg = input.measuredWeightKg;
  shipment.status = decision === "approved" ? "approved_for_storage" : decision === "blocked" ? "blocked" : decision === "quarantined" ? "quarantined_at_hub" : "inspection_required";

  const inspection: Inspection = {
    agent: input.session.name,
    declaredWeightKg: shipment.declaredWeightKg,
    decision,
    inspectedAt: now(),
    measuredWeightKg: input.measuredWeightKg,
    note: input.note ?? "",
    packageCondition: decision === "approved" ? "conforme" : "a verifier",
    packagingQuality: input.packagingQuality,
    riskLevel,
    shipmentId: shipment.id,
    variancePercent: tolerance.variancePercent,
  };

  store.inspections.unshift(inspection);
  store.trackingEvents.push(tracking(shipment.id, shipment.status, input.note || "Inspection Hub enregistree."));
  store.auditEvents.push(audit("hub_inspection_recorded", "shipment", shipment.id, input.session.name, { decision, variancePercent: Number(tolerance.variancePercent.toFixed(2)) }));

  if (tolerance.requiresIncident || decision !== "approved") {
    createAnomalyInternal({
      blocksBatch: decision !== "approved",
      blocksPayout: decision === "blocked" || decision === "rejected" || decision === "quarantined",
      blocksShipment: decision !== "approved",
      description: input.note || "Inspection avec ecart a verifier.",
      hubId: input.session.hubId,
      photoCount: 0,
      priority: riskLevel,
      shipmentId: shipment.id,
      title: `Inspection ${shipment.trackingCode}`,
      type: tolerance.requiresIncident ? "wrong_weight" : "packaging_issue",
    });
  }

  return inspection;
}

export function moveInventory(input: {
  measuredWeightKg?: number;
  note?: string;
  session: HubSession;
  shipmentId: string;
  status?: InventoryStatus;
  toLocationId: string;
}) {
  const store = state();
  const inventory = getInventoryByShipment(input.shipmentId);
  const location = store.storageLocations.find((candidate) => candidate.id === input.toLocationId || candidate.code === input.toLocationId);

  if (!inventory) {
    throw new Error("Active inventory item not found.");
  }

  if (!location) {
    throw new Error("Storage location not found.");
  }

  inventory.locationId = location.id;
  inventory.status = input.status ?? "in_storage";
  inventory.measuredWeightKg = input.measuredWeightKg ?? inventory.measuredWeightKg;
  inventory.lastMovementAt = now();

  const shipment = getShipment(input.shipmentId);
  if (shipment) {
    shipment.status = inventory.status === "in_storage" ? "in_storage" : shipment.status;
  }

  store.trackingEvents.push(tracking(input.shipmentId, shipment?.status ?? "in_storage", input.note || `Deplacement vers ${location.code}.`));
  store.auditEvents.push(audit("hub_inventory_moved", "shipment", input.shipmentId, input.session.name, { location: location.code, status: inventory.status }));

  return inventory;
}

export function createBatch(input: {
  session: HubSession;
  shipmentIds: string[];
  tripId: string;
}) {
  const store = state();
  const trip = getTrip(input.tripId);

  if (!trip) {
    throw new Error("Trip not found.");
  }

  if (trip.kycStatus !== "verified" || trip.status !== "validated") {
    throw new Error("Traveler trip is not eligible for Hub batching.");
  }

  const batch: HubBatch = {
    batchCode: `HUB-${trip.arrivalAirport}-${randomUUID().slice(0, 6).toUpperCase()}`,
    capacityReservedKg: 0,
    destinationCity: trip.arrivalCity,
    destinationCountry: trip.arrivalCountry,
    handoverDeadlineAt: hoursFromNow(6),
    hubId: input.session.hubId,
    id: `batch-${randomUUID()}`,
    locationId: "loc-prep-01",
    shipmentIds: [],
    status: "draft",
    totalWeightKg: 0,
    travelerId: trip.travelerId,
    tripId: trip.id,
  };

  store.batches.unshift(batch);
  store.auditEvents.push(audit("hub_batch_created", "hub_batch", batch.id, input.session.name, { tripId: trip.id }));

  for (const shipmentId of input.shipmentIds) {
    reserveShipmentForBatch({ batchId: batch.id, session: input.session, shipmentId });
  }

  return batch;
}

export function reserveShipmentForBatch(input: {
  batchId: string;
  session: HubSession;
  shipmentId: string;
}) {
  const store = state();
  const batch = getBatch(input.batchId);
  const shipment = getShipment(input.shipmentId);
  const trip = batch ? getTrip(batch.tripId) : null;
  const inventory = shipment ? getInventoryByShipment(shipment.id) : null;

  if (!batch || !shipment || !trip || !inventory) {
    throw new Error("Batch, trip, shipment or inventory not found.");
  }

  const alreadyReserved = store.batches.some(
    (candidate) =>
      candidate.id !== batch.id &&
      !["cancelled", "completed", "disputed"].includes(candidate.status) &&
      candidate.shipmentIds.includes(shipment.id),
  );

  const reservation = assertCapacityReservation({
    alreadyReserved,
    batchCapacityKg: trip.capacityKg,
    batchDestinationCountry: batch.destinationCountry,
    currentReservedKg: batch.capacityReservedKg,
    shipmentDestinationCountry: shipment.destinationCountry,
    shipmentWeightKg: inventory.measuredWeightKg,
  });

  if (!batch.shipmentIds.includes(shipment.id)) {
    batch.shipmentIds.push(shipment.id);
  }

  batch.capacityReservedKg = reservation.reservedAfterKg;
  batch.totalWeightKg = reservation.reservedAfterKg;
  batch.status = "capacity_reserved";
  inventory.status = "reserved_for_batch";
  shipment.status = "reserved_for_batch";
  trip.reservedKg = Math.max(trip.reservedKg, batch.capacityReservedKg);

  store.trackingEvents.push(tracking(shipment.id, "reserved_for_batch", `Reserve dans ${batch.batchCode}.`));
  store.auditEvents.push(audit("hub_capacity_reserved", "hub_batch", batch.id, input.session.name, { shipmentId: shipment.id, remainingAfterKg: Number(reservation.remainingAfterKg.toFixed(2)) }));

  return batch;
}

export function markBatchReady(batchId: string, session: HubSession) {
  const batch = getBatch(batchId);

  if (!batch) {
    throw new Error("Batch not found.");
  }

  if (batch.shipmentIds.length === 0) {
    throw new Error("Batch cannot be marked ready without shipments.");
  }

  batch.status = "ready";
  batch.validatedBy = session.name;
  state().auditEvents.push(audit("hub_batch_ready", "hub_batch", batch.id, session.name, { batchCode: batch.batchCode }));

  return batch;
}

export function generatePickupQr(batchId: string, session: HubSession) {
  const batch = getBatch(batchId);

  if (!batch) {
    throw new Error("Batch not found.");
  }

  if (!["ready", "pickup_qr_generated"].includes(batch.status)) {
    throw new Error("Pickup QR can only be generated for a ready batch.");
  }

  const token: PickupQrToken = {
    batchId: batch.id,
    expiresAt: hoursFromNow(4),
    hubId: batch.hubId,
    id: `qr-${randomUUID()}`,
    revoked: false,
    token: `ybq_${randomUUID()}_${randomUUID()}`,
    travelerId: batch.travelerId,
    tripId: batch.tripId,
  };

  batch.pickupQr = token;
  batch.status = "pickup_qr_generated";
  state().auditEvents.push(audit("hub_pickup_qr_generated", "hub_batch", batch.id, session.name, { tokenId: token.id }));

  return token;
}

export function handoverBatch(input: {
  batchId: string;
  measuredWeightKg?: number;
  note?: string;
  session: HubSession;
  token: string;
  verifiedDocument: boolean;
  verifiedIdentity: boolean;
  verifiedTicket: boolean;
}) {
  const store = state();
  const batch = getBatch(input.batchId);

  if (!batch?.pickupQr) {
    throw new Error("Pickup QR token not found.");
  }

  const qr = batch.pickupQr;

  if (qr.token !== input.token) {
    throw new Error("Invalid pickup QR token.");
  }

  if (qr.revoked) {
    throw new Error("Pickup QR token is revoked.");
  }

  if (qr.usedAt) {
    throw new Error("Pickup QR token has already been used.");
  }

  if (new Date(qr.expiresAt).getTime() < Date.now()) {
    throw new Error("Pickup QR token has expired.");
  }

  assertHandoverChecks({
    verifiedDocument: input.verifiedDocument,
    verifiedIdentity: input.verifiedIdentity,
    verifiedTicket: input.verifiedTicket,
  });

  qr.usedAt = now();
  batch.status = "handed_over";

  for (const shipmentId of batch.shipmentIds) {
    const shipment = getShipment(shipmentId);
    const inventory = getInventoryByShipment(shipmentId);

    if (shipment) {
      shipment.status = "handed_over_to_traveler";
      store.trackingEvents.push(tracking(shipment.id, "handed_over_to_traveler", `Remis au voyageur pour ${batch.destinationCity}.`));
    }

    if (inventory) {
      inventory.active = false;
      inventory.status = "handed_over";
      inventory.lastMovementAt = now();
    }
  }

  store.notifications.unshift(notification("Lot remis", `${batch.batchCode} a ete remis au voyageur.`, "medium"));
  store.auditEvents.push(audit("hub_batch_handed_over", "hub_batch", batch.id, input.session.name, { tokenId: qr.id, measuredWeightKg: input.measuredWeightKg ?? batch.totalWeightKg }));

  return batch;
}

export function createAnomaly(input: {
  batchId?: string;
  blocksPayout?: boolean;
  description: string;
  hubId: string;
  priority: Priority;
  session: HubSession;
  shipmentId?: string;
  title: string;
  type: AnomalyType;
}) {
  const anomaly = createAnomalyInternal({
    batchId: input.batchId,
    blocksBatch: Boolean(input.batchId),
    blocksPayout: Boolean(input.blocksPayout),
    blocksShipment: Boolean(input.shipmentId),
    description: input.description,
    hubId: input.hubId,
    photoCount: 0,
    priority: input.priority,
    shipmentId: input.shipmentId,
    title: input.title,
    type: input.type,
  });

  state().auditEvents.push(audit("hub_anomaly_created", "operational_incident", anomaly.id, input.session.name, { type: anomaly.type, priority: anomaly.priority }));

  return anomaly;
}

function createAnomalyInternal(input: {
  batchId?: string;
  blocksBatch: boolean;
  blocksPayout: boolean;
  blocksShipment: boolean;
  description: string;
  hubId: string;
  photoCount: number;
  priority: Priority;
  shipmentId?: string;
  title: string;
  type: AnomalyType;
}) {
  const anomaly: Anomaly = {
    assignedTo: input.priority === "urgent" || input.priority === "critical" ? "hub_supervisor" : undefined,
    batchId: input.batchId,
    blocksBatch: input.blocksBatch,
    blocksPayout: input.blocksPayout,
    blocksShipment: input.blocksShipment,
    createdAt: now(),
    description: input.description,
    hubId: input.hubId,
    id: `anom-${randomUUID()}`,
    photoCount: input.photoCount,
    priority: input.priority,
    shipmentId: input.shipmentId,
    status: input.priority === "critical" ? "blocked" : "open",
    title: input.title,
    type: input.type,
  };

  state().anomalies.unshift(anomaly);
  state().notifications.unshift(notification("Anomalie Hub", input.title, input.priority));

  return anomaly;
}

export function resolveAnomaly(id: string, session: HubSession) {
  const anomaly = getAnomaly(id);

  if (!anomaly) {
    throw new Error("Anomaly not found.");
  }

  anomaly.status = "resolved";
  state().auditEvents.push(audit("hub_anomaly_resolved", "operational_incident", anomaly.id, session.name, { type: anomaly.type }));

  return anomaly;
}

export function exportReportsCsv() {
  const rows = [["label", "value", "unit", "trend"], ...state().reports.map((report) => [report.label, String(report.value), report.unit, report.trend])];

  return rows.map((row) => row.map((value) => `"${value.replaceAll('"', '""')}"`).join(",")).join("\n");
}

export function statusTone(status: string): "neutral" | "success" | "warning" | "danger" | "info" {
  if (["confirmed", "closed", "approved", "in_storage", "ready", "completed", "resolved"].includes(status)) return "success";
  if (["missing_at_hub", "damaged_at_hub", "blocked", "quarantined", "rejected", "critical", "urgent"].includes(status)) return "danger";
  if (["needs_review", "inspection_required", "capacity_reserved", "awaiting_validation", "open"].includes(status)) return "warning";
  if (["pickup_qr_generated", "handed_over", "in_transit", "scanning"].includes(status)) return "info";

  return "neutral";
}

export function batchStatusLabel(status: BatchStatus) {
  return status.replaceAll("_", " ");
}
