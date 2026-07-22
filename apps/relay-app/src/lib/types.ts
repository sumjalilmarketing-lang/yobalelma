import type { PlatformRole } from "@/lib/auth/roles";

export type RelayRole = "relay_agent" | "relay_manager" | "operations_manager";
export type RelayPermission = "relay:read" | "relay:write" | "relay:manage" | "relay:audit";
export type Tone = "neutral" | "success" | "warning" | "danger" | "info";
export type RelayPackageStatus = "expected" | "received" | "controlled" | "stored" | "awaiting_carrier" | "awaiting_recipient" | "handed_over" | "refused" | "anomaly";

export type RelaySession = {
  email: string;
  expiresAt: number;
  name: string;
  role: RelayRole;
  sessionId: string;
  userId?: string;
  source?: "demo" | "supabase";
  relayPointId?: string;
};

export type RelayNavigationItem = {
  href: string;
  label: string;
  permission: RelayPermission;
  group: "reception" | "inventory" | "handover" | "account";
};

export type PackageDimensions = { heightCm: number; lengthCm: number; widthCm: number };
export type RelayPackage = {
  id: string;
  trackingCode: string;
  sender: string;
  recipient: string;
  destination: string;
  status: RelayPackageStatus;
  weightKg: number;
  expectedWeightKg: number;
  dimensions: PackageDimensions;
  expectedDimensions: PackageDimensions;
  locationCode?: string;
  carrierBatch?: string;
  receivedAt: string;
  dueAt: string;
  photoCount: number;
  qualityScore: number;
  otpRequired: boolean;
};

export type StorageLocation = {
  id: string;
  code: string;
  kind: "shelf" | "locker" | "secure_cage" | "oversize";
  zone: string;
  capacity: number;
  occupied: number;
  maxWeightKg: number;
  status: "available" | "near_capacity" | "full" | "maintenance";
};

export type RelayIncident = {
  id: string;
  type: string;
  title: string;
  severity: "low" | "medium" | "high";
  status: "open" | "investigating" | "resolved";
  at: string;
  trackingCode?: string;
};

export type RelayEvent = { id: string; at: string; action: string; actor: string; entity: string; detail: string };
export type RelayState = {
  source: "live" | "unavailable" | "fixture";
  loadError?: string;
  relayPoint: { id: string; name: string; code: string; address: string; network: string; capacity: number; openUntil: string };
  packages: RelayPackage[];
  locations: StorageLocation[];
  incidents: RelayIncident[];
  events: RelayEvent[];
  notifications: Array<{ id: string; title: string; message: string; at: string; read: boolean }>;
  sync: { pending: number; lastSyncedAt: string; online: boolean };
};

export function isRelayRole(role: PlatformRole | string | undefined): role is RelayRole {
  return role === "relay_agent" || role === "relay_manager" || role === "operations_manager";
}
