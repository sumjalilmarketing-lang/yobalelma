import type { PlatformRole } from "@/lib/auth/roles";

export type HubRole = "hub_agent" | "hub_supervisor" | "hub_manager" | "operations_manager";

export type HubPermission =
  | "hub:read"
  | "hub:write"
  | "hub:supervise"
  | "hub:manage"
  | "hub:handover"
  | "hub:settings"
  | "hub:reports";

export type HubSession = {
  email: string;
  expiresAt: number;
  hubId: string;
  name: string;
  role: HubRole;
  sessionId: string;
  source?: "demo" | "supabase";
  userId?: string;
};

export type HubNavigationItem = {
  href: string;
  labelKey: HubMessageKey;
  permission: HubPermission;
};

export type HubStatusTone = "neutral" | "success" | "warning" | "danger" | "info";

export type InboundItemStatus =
  | "expected_at_hub"
  | "arrived_at_hub"
  | "received_at_hub"
  | "partially_received"
  | "missing_at_hub"
  | "extra_at_hub"
  | "damaged_at_hub"
  | "rejected_at_hub"
  | "quarantined_at_hub";

export type ManifestStatus = "open" | "scanning" | "needs_review" | "confirmed" | "closed";

export type ShipmentStatus =
  | "expected_at_hub"
  | "at_hub"
  | "inspection_required"
  | "approved_for_storage"
  | "in_storage"
  | "reserved_for_batch"
  | "picked_for_batch"
  | "ready_for_handover"
  | "handed_over_to_traveler"
  | "quarantined_at_hub"
  | "blocked"
  | "missing_at_hub"
  | "damaged_at_hub";

export type InspectionDecision =
  | "approved"
  | "repackaging_required"
  | "customer_confirmation_required"
  | "blocked"
  | "rejected"
  | "quarantined";

export type InventoryStatus =
  | "received"
  | "inspection_required"
  | "approved"
  | "quarantined"
  | "rejected"
  | "in_storage"
  | "reserved_for_batch"
  | "picked_for_batch"
  | "handed_over"
  | "damaged"
  | "missing";

export type BatchStatus =
  | "draft"
  | "capacity_reserved"
  | "preparing"
  | "awaiting_validation"
  | "ready"
  | "pickup_qr_generated"
  | "handed_over"
  | "in_transit"
  | "destination_received"
  | "partially_received"
  | "disputed"
  | "completed"
  | "cancelled";

export type AnomalyStatus = "open" | "assigned" | "escalated" | "blocked" | "resolved" | "closed";
export type Priority = "low" | "medium" | "high" | "urgent" | "critical";

export type AnomalyType =
  | "missing_package"
  | "extra_package"
  | "damaged_package"
  | "wrong_weight"
  | "wrong_dimensions"
  | "prohibited_item"
  | "packaging_issue"
  | "wrong_destination"
  | "traveler_cancelled"
  | "flight_changed"
  | "capacity_mismatch"
  | "qr_issue"
  | "storage_issue"
  | "manifest_mismatch";

export type Hub = {
  id: string;
  airportCode: string;
  city: string;
  code: string;
  country: string;
  name: string;
  timezone: string;
};

export type RelayStop = {
  expectedPackages: number;
  receivedPackages: number;
  relayCode: string;
  relayName: string;
};

export type InboundManifestItem = {
  conditionNote?: string;
  destinationCity: string;
  destinationCountry: string;
  photoCount: number;
  shipmentId: string;
  status: InboundItemStatus;
  trackingCode: string;
  weightKg: number;
};

export type InboundManifest = {
  arrivedAt: string;
  collectionDriver: string;
  collectionVehicle: string;
  hubId: string;
  id: string;
  relayStops: RelayStop[];
  sealedBy: string;
  status: ManifestStatus;
  items: InboundManifestItem[];
};

export type Inspection = {
  agent: string;
  declaredWeightKg: number;
  decision: InspectionDecision;
  inspectedAt: string;
  measuredWeightKg: number;
  note: string;
  packageCondition: string;
  packagingQuality: "excellent" | "acceptable" | "weak" | "non_compliant";
  riskLevel: Priority;
  shipmentId: string;
  variancePercent: number;
};

export type Shipment = {
  category: string;
  declaredContent: string;
  declaredValueCents: number;
  declaredWeightKg: number;
  destinationCity: string;
  destinationCountry: string;
  dimensionsCm: { height: number; length: number; width: number };
  fragile: boolean;
  id: string;
  originCity: string;
  priority: Priority;
  recipientName: string;
  senderName: string;
  status: ShipmentStatus;
  trackingCode: string;
};

export type StorageLocation = {
  aisle: string;
  code: string;
  hubId: string;
  id: string;
  maxWeightKg: number;
  occupiedWeightKg: number;
  shelf: string;
  type: "reception" | "inspection" | "storage" | "quarantine" | "preparation";
  zone: string;
};

export type InventoryItem = {
  active: boolean;
  enteredAt: string;
  id: string;
  lastMovementAt: string;
  locationId: string;
  measuredWeightKg: number;
  shipmentId: string;
  status: InventoryStatus;
};

export type TravelerTrip = {
  airline: string;
  arrivalAirport: string;
  arrivalCity: string;
  arrivalCountry: string;
  capacityKg: number;
  departureAirport: string;
  departureAt: string;
  flightNumber: string;
  id: string;
  kycStatus: "verified" | "pending" | "rejected";
  reservedKg: number;
  status: "validated" | "boarding" | "cancelled" | "completed";
  travelerId: string;
  travelerName: string;
};

export type HubBatch = {
  batchCode: string;
  capacityReservedKg: number;
  destinationCity: string;
  destinationCountry: string;
  handoverDeadlineAt: string;
  hubId: string;
  id: string;
  locationId: string;
  pickupQr?: PickupQrToken;
  shipmentIds: string[];
  status: BatchStatus;
  totalWeightKg: number;
  travelerId: string;
  tripId: string;
  validatedBy?: string;
};

export type PickupQrToken = {
  batchId: string;
  expiresAt: string;
  hubId: string;
  id: string;
  revoked: boolean;
  token: string;
  tripId: string;
  usedAt?: string;
  travelerId: string;
};

export type Anomaly = {
  assignedTo?: string;
  batchId?: string;
  blocksBatch: boolean;
  blocksPayout: boolean;
  blocksShipment: boolean;
  createdAt: string;
  description: string;
  hubId: string;
  id: string;
  photoCount: number;
  priority: Priority;
  shipmentId?: string;
  status: AnomalyStatus;
  title: string;
  type: AnomalyType;
};

export type AuditEvent = {
  action: string;
  actor: string;
  at: string;
  entityId: string;
  entityType: string;
  id: string;
  metadata: Record<string, string | number | boolean | null>;
};

export type TrackingEvent = {
  at: string;
  id: string;
  note: string;
  shipmentId: string;
  status: ShipmentStatus | BatchStatus | InboundItemStatus;
};

export type HubNotification = {
  at: string;
  id: string;
  message: string;
  priority: Priority;
  read: boolean;
  title: string;
};

export type HubReport = {
  label: string;
  trend: string;
  unit: string;
  value: number;
};

export type HubDashboardSnapshot = {
  alerts: HubNotification[];
  auditEvents: AuditEvent[];
  capacityRemainingKg: number;
  capacityReservedKg: number;
  capacityTotalKg: number;
  kpis: Array<{ key: string; label: string; tone: HubStatusTone; value: string }>;
  priorityTasks: Array<{ href: string; label: string; tone: HubStatusTone }>;
  processingMinutesAvg: number;
  reports: HubReport[];
  totalWeightInHubKg: number;
};

export type HubRouteKind =
  | "dashboard"
  | "inbound"
  | "inboundDetail"
  | "scanner"
  | "inspection"
  | "inspectionDetail"
  | "inventory"
  | "inventoryDetail"
  | "storage"
  | "storageLocations"
  | "trips"
  | "tripDetail"
  | "capacities"
  | "batches"
  | "batchNew"
  | "batchDetail"
  | "handover"
  | "handoverDetail"
  | "anomalies"
  | "anomalyDetail"
  | "history"
  | "reports"
  | "notifications"
  | "profile"
  | "settings"
  | "controlTower"
  | "agents"
  | "search"
  | "incidents"
  | "alerts"
  | "stockMonitoring"
  | "forecast"
  | "systemHealth"
  | "audit"
  | "exports"
  | "documents"
  | "notFound";

export type HubMessageKey =
  | "dashboard"
  | "inbound"
  | "scanner"
  | "inspection"
  | "inventory"
  | "storage"
  | "trips"
  | "capacities"
  | "batches"
  | "handover"
  | "anomalies"
  | "history"
  | "reports"
  | "notifications"
  | "profile"
  | "settings"
  | "controlTower"
  | "agents"
  | "search"
  | "incidents"
  | "alerts"
  | "stockMonitoring"
  | "forecast"
  | "systemHealth"
  | "audit"
  | "exports"
  | "documents";

export function isHubRole(role: PlatformRole | string | undefined): role is HubRole {
  return (
    role === "hub_agent" ||
    role === "hub_supervisor" ||
    role === "hub_manager" ||
    role === "operations_manager"
  );
}
