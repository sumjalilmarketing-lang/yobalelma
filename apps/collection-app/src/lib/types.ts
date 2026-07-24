import type { PlatformRole } from "@/lib/auth/roles";

export type CollectionRole = "collection_driver" | "collection_supervisor" | "collection_manager" | "operations_manager";
export type CollectionPermission = "collection:read" | "collection:write" | "collection:manage" | "collection:audit";
export type Tone = "neutral" | "success" | "warning" | "danger" | "info";
export type MissionStatus = "assigned" | "accepted" | "en_route" | "at_stop" | "loading" | "in_transit" | "unloading" | "completed" | "incident";
export type StopKind = "relay" | "hub" | "airport" | "port" | "distribution_center";

export type CollectionSession = {
  email: string; expiresAt: number; name: string; role: CollectionRole; sessionId: string;
  userId?: string; source?: "demo" | "supabase"; vehicleId?: string;
};

export type CollectionNavigationItem = { href: string; label: string; permission: CollectionPermission; group: "missions" | "operations" | "fleet" | "account" };
export type GeoPoint = { lat: number; lng: number; label: string };
export type CollectionStop = {
  id: string; kind: StopKind; name: string; address: string; eta: string; status: "pending" | "arrived" | "completed";
  position?: GeoPoint; expectedPackages: number; scannedPackages: number; signatureRequired: boolean;
};
export type CollectionMission = {
  id: string; code: string; title: string; origin: string; destination: string; status: MissionStatus; priority: "normal" | "high" | "urgent";
  distanceKm: number; durationMinutes: number; packageCount: number; batchCount: number; weightKg: number; progress: number;
  assignedAt: string; scheduledStart: string; optimized: boolean; carbonKg: number; stops: CollectionStop[];
};
export type Vehicle = {
  id: string; plate: string; model: string; type: "van" | "truck"; capacityKg: number; loadKg: number; mileageKm: number;
  fuelPercent: number; fuelConsumptionL100Km: number; status: "ready" | "maintenance" | "inspection"; nextMaintenanceKm: number;
  inspectionItems: Array<{ label: string; ok: boolean }>;
};
export type PackageItem = { id: string; trackingCode: string; batchCode?: string; status: "expected" | "loaded" | "unloaded" | "anomaly"; weightKg: number; destination: string; photoCount: number };
export type Incident = { id: string; type: string; title: string; severity: "low" | "medium" | "high"; status: "open" | "investigating" | "resolved"; at: string; missionCode: string };
export type CollectionEvent = { id: string; at: string; action: string; actor: string; entity: string; detail: string };
export type CollectionState = {
  source: "live" | "unavailable" | "fixture"; loadError?: string;
  missions: CollectionMission[]; packages: PackageItem[]; vehicle: Vehicle | null; incidents: Incident[]; events: CollectionEvent[];
  notifications: Array<{ id: string; title: string; message: string; at: string; read: boolean }>;
  messages: Array<{ id: string; sender: string; message: string; at: string }>;
  gps: { position: GeoPoint; speedKph: number; accuracyMeters: number; updatedAt: string } | null;
  sync: { pending: number; lastSyncedAt?: string; online: boolean };
};

export function isCollectionRole(role: PlatformRole | string | undefined): role is CollectionRole {
  return role === "collection_driver" || role === "collection_supervisor" || role === "collection_manager" || role === "operations_manager";
}
