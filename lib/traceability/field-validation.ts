import type { CustodyStage, TraceabilityEventType } from "./domain";

export const fieldRecipe = [
  step("sender-to-origin-relay", "created", "at_origin_relay", "client", "relay_agent", ["qr", "parcel_photo", "gps"]),
  step("origin-relay-to-national-driver", "at_origin_relay", "with_collection_driver", "relay_agent", "collection_driver", ["qr", "server_confirmation", "gps"]),
  step("national-driver-to-origin-hub", "with_collection_driver", "at_origin_hub", "collection_driver", "hub_agent", ["qr", "server_confirmation", "gps"]),
  step("origin-hub-to-carrier", "at_origin_hub", "with_traveler", "hub_agent", "traveler", ["qr", "identity", "signature"]),
  step("carrier-to-destination-hub", "with_traveler", "at_destination_hub", "traveler", "hub_agent", ["qr", "server_confirmation", "gps"]),
  step("destination-hub-to-last-mile", "at_destination_hub", "with_last_mile_driver", "hub_agent", "local_transporter", ["qr", "server_confirmation", "gps"]),
  step("last-mile-to-destination-relay", "with_last_mile_driver", "at_destination_relay", "local_transporter", "relay_agent", ["qr", "server_confirmation", "gps"]),
  step("destination-relay-to-recipient", "at_destination_relay", "delivered", "relay_agent", "recipient", ["otp", "signature", "delivery", "gps"]),
] as const;

export type FieldProofType = "qr" | "otp" | "signature" | "parcel_photo" | "identity" | "gps" | "server_confirmation" | "delivery";
export type TransferDecision = "confirm" | "reject";

export type SensitiveTransfer = {
  id: string;
  parcelId: string;
  stageBefore: CustodyStage;
  stageAfter: CustodyStage;
  giverId: string;
  receiverId: string;
  giverConfirmedAt: string;
  receiverConfirmedAt: string | null;
  status: "pending" | "confirmed" | "rejected" | "expired";
  expiresAt: string;
  requestedLatitude: number;
  requestedLongitude: number;
  requiredProofTypes: readonly FieldProofType[];
  proofTypes: readonly FieldProofType[];
  decisionKey: string | null;
  rejectionReason: string | null;
};

type TransferResult =
  | { ok: true; transfer: SensitiveTransfer; replay: boolean }
  | { ok: false; code: "actor_mismatch" | "already_finalized" | "expired" | "invalid_location" | "missing_proof" | "invalid_rejection"; transfer: SensitiveTransfer };

export function requestSensitiveTransfer(input: {
  id: string;
  parcelId: string;
  stageBefore: CustodyStage;
  stageAfter: CustodyStage;
  currentCustodianId: string;
  giverId: string;
  receiverId: string;
  requestedAt: string;
  expiresAt: string;
  latitude: number;
  longitude: number;
  requiredProofTypes: readonly FieldProofType[];
  proofTypes: readonly FieldProofType[];
}): SensitiveTransfer {
  if (input.giverId !== input.currentCustodianId) throw new Error("giver_must_be_current_custodian");
  if (!input.receiverId || input.receiverId === input.giverId) throw new Error("receiver_must_be_distinct");
  if (!Number.isFinite(input.latitude) || Math.abs(input.latitude) > 90 || !Number.isFinite(input.longitude) || Math.abs(input.longitude) > 180) throw new Error("invalid_location");
  if (new Date(input.expiresAt).getTime() <= new Date(input.requestedAt).getTime()) throw new Error("invalid_expiration");
  return {
    id: input.id,
    parcelId: input.parcelId,
    stageBefore: input.stageBefore,
    stageAfter: input.stageAfter,
    giverId: input.giverId,
    receiverId: input.receiverId,
    giverConfirmedAt: input.requestedAt,
    receiverConfirmedAt: null,
    status: "pending",
    expiresAt: input.expiresAt,
    requestedLatitude: input.latitude,
    requestedLongitude: input.longitude,
    requiredProofTypes: [...input.requiredProofTypes],
    proofTypes: [...input.proofTypes],
    decisionKey: null,
    rejectionReason: null,
  };
}

export function decideSensitiveTransfer(transfer: SensitiveTransfer, input: {
  actorId: string;
  decision: TransferDecision;
  decisionKey: string;
  decidedAt: string;
  latitude: number;
  longitude: number;
  rejectionReason?: string;
  maximumDistanceMeters?: number;
}): TransferResult {
  if (transfer.status !== "pending") {
    if (transfer.decisionKey === input.decisionKey) return { ok: true, transfer, replay: true };
    return { ok: false, code: "already_finalized", transfer };
  }
  if (new Date(input.decidedAt).getTime() > new Date(transfer.expiresAt).getTime()) {
    return { ok: false, code: "expired", transfer: { ...transfer, status: "expired", decisionKey: input.decisionKey } };
  }
  if (input.decision === "reject") {
    if (![transfer.giverId, transfer.receiverId].includes(input.actorId)) return { ok: false, code: "actor_mismatch", transfer };
    if (!input.rejectionReason?.trim()) return { ok: false, code: "invalid_rejection", transfer };
    return { ok: true, replay: false, transfer: { ...transfer, status: "rejected", rejectionReason: input.rejectionReason.trim(), decisionKey: input.decisionKey } };
  }
  if (input.actorId !== transfer.receiverId) return { ok: false, code: "actor_mismatch", transfer };
  if (distanceMeters(transfer.requestedLatitude, transfer.requestedLongitude, input.latitude, input.longitude) > (input.maximumDistanceMeters ?? 2_000)) {
    return { ok: false, code: "invalid_location", transfer };
  }
  if (transfer.requiredProofTypes.some((required) => !transfer.proofTypes.includes(required))) {
    return { ok: false, code: "missing_proof", transfer };
  }
  return {
    ok: true,
    replay: false,
    transfer: { ...transfer, status: "confirmed", receiverConfirmedAt: input.decidedAt, decisionKey: input.decisionKey },
  };
}

export type FieldAuditEvent = {
  sequence: number;
  eventType: TraceabilityEventType;
  stageBefore: CustodyStage;
  stageAfter: CustodyStage;
  previousHash: string | null;
  hash: string;
  idempotencyKey: string;
  proofTypes: readonly FieldProofType[];
  dualValidation: boolean;
  passportUpdated: boolean;
  digitalTwinUpdated: boolean;
  controlTowerUpdated: boolean;
};

export function auditFieldRecipe(events: readonly FieldAuditEvent[]) {
  const failures: string[] = [];
  if (events.length !== fieldRecipe.length) failures.push("incomplete_chain");
  const keys = new Set<string>();
  events.forEach((event, index) => {
    const expected = fieldRecipe[index];
    if (!expected || event.sequence !== index + 1) failures.push(`sequence:${index + 1}`);
    if (expected && (event.stageBefore !== expected.stageBefore || event.stageAfter !== expected.stageAfter)) failures.push(`stage:${expected.id}`);
    if (index > 0 && event.previousHash !== events[index - 1]?.hash) failures.push(`hash:${index + 1}`);
    if (keys.has(event.idempotencyKey)) failures.push(`duplicate:${event.idempotencyKey}`);
    keys.add(event.idempotencyKey);
    if (expected?.requiredProofTypes.some((proof) => !event.proofTypes.includes(proof))) failures.push(`proof:${expected.id}`);
    if (!event.dualValidation) failures.push(`dual:${expected?.id ?? index + 1}`);
    if (!event.passportUpdated) failures.push(`passport:${expected?.id ?? index + 1}`);
    if (!event.digitalTwinUpdated) failures.push(`digital-twin:${expected?.id ?? index + 1}`);
    if (!event.controlTowerUpdated) failures.push(`control-tower:${expected?.id ?? index + 1}`);
  });
  const final = events.at(-1);
  if (!final || final.stageAfter !== "delivered" || !final.proofTypes.some((proof) => ["otp", "signature", "delivery"].includes(proof))) failures.push("final_proof");
  return { ok: failures.length === 0, failures };
}

function step(id: string, stageBefore: CustodyStage, stageAfter: CustodyStage, giverRole: string, receiverRole: string, requiredProofTypes: readonly FieldProofType[]) {
  return { id, stageBefore, stageAfter, giverRole, receiverRole, requiredProofTypes };
}

function distanceMeters(latitudeA: number, longitudeA: number, latitudeB: number, longitudeB: number) {
  const radians = (value: number) => value * Math.PI / 180;
  const deltaLatitude = radians(latitudeB - latitudeA);
  const deltaLongitude = radians(longitudeB - longitudeA);
  const a = Math.sin(deltaLatitude / 2) ** 2 + Math.cos(radians(latitudeA)) * Math.cos(radians(latitudeB)) * Math.sin(deltaLongitude / 2) ** 2;
  return 6_371_000 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}
