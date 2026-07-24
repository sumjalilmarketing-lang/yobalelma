import { z } from "zod";
import { custodyStages, traceabilityEventTypes } from "@/lib/traceability/domain";

const optionalUuid = z.string().uuid().optional();

export const traceabilityEventSchema = z.object({
  parcelId: z.string().uuid(),
  eventType: z.enum(traceabilityEventTypes),
  stageAfter: z.enum(custodyStages),
  previousCustodianId: z.string().trim().min(1).max(160).optional(),
  newCustodianType: z.string().trim().min(1).max(80).optional(),
  newCustodianId: z.string().trim().min(1).max(160).optional(),
  newLocationId: z.string().trim().min(1).max(160).optional(),
  missionId: optionalUuid,
  vehicleId: optionalUuid,
  driverId: optionalUuid,
  travelerId: optionalUuid,
  relayId: optionalUuid,
  hubId: optionalUuid,
  countryCode: z.string().trim().length(2).transform((value) => value.toUpperCase()),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  locationAccuracy: z.number().nonnegative().max(100_000).optional(),
  locationSource: z.enum(["gps_direct", "driver", "vehicle", "site_scan", "declared", "last_known"]).optional(),
  occurredAt: z.string().datetime({ offset: true }).optional(),
  recordedByRole: z.string().trim().min(1).max(80),
  deviceId: z.string().trim().max(160).optional(),
  applicationSource: z.enum(["user-app", "collection-app", "relay-app", "hub-app", "admin-app", "partner-api", "offline-sync"]),
  eventSource: z.enum(["api", "scan", "qr", "otp", "manual_correction", "offline_sync", "system"]),
  proofIds: z.array(z.string().uuid()).max(20).default([]),
  parcelCondition: z.enum(["unknown", "intact", "light_damage", "severe_damage", "seal_intact", "seal_broken", "suspect_content", "weight_mismatch", "dimension_mismatch", "opened", "wet", "crushed", "other"]).default("unknown"),
  conditionSeverity: z.enum(["low", "medium", "high", "critical"]).optional(),
  notes: z.string().trim().max(2000).optional(),
  nextStage: z.string().trim().max(100).optional(),
  nextLocationId: z.string().trim().max(160).optional(),
  eta: z.string().datetime({ offset: true }).optional(),
  delayReason: z.string().trim().max(500).optional(),
  interventionOwnerId: optionalUuid,
  correctionOfEventId: optionalUuid,
  correctionReason: z.string().trim().min(8).max(1000).optional(),
  idempotencyKey: z.string().trim().min(12).max(200),
  metadata: z.record(z.string(), z.unknown()).default({}),
}).superRefine((value, context) => {
  const transfer = ["custody_transfer_confirmed", "parcel_handed_to_traveler", "parcel_delivered", "parcel_collected_by_recipient"].includes(value.eventType);
  if (transfer && (!value.previousCustodianId || !value.newCustodianId || !value.newCustodianType)) context.addIssue({ code: "custom", path: ["newCustodianId"], message: "Le remettant et le nouveau detenteur sont obligatoires." });
  if (value.correctionOfEventId && !value.correctionReason) context.addIssue({ code: "custom", path: ["correctionReason"], message: "La raison de correction est obligatoire." });
});

export const traceabilityProofSchema = z.object({
  parcelId: z.string().uuid(),
  proofType: z.enum(["qr", "otp", "signature", "parcel_photo", "seal_photo", "barcode_scan", "identity", "gps", "server_confirmation", "customs_document", "payment", "delivery", "incident_report"]),
  proofHash: z.string().regex(/^[a-f0-9]{64}$/i),
  storageBucket: z.string().trim().max(100).optional(),
  storagePath: z.string().trim().max(500).optional(),
  capturedAt: z.string().datetime({ offset: true }).optional(),
  deviceId: z.string().trim().max(160).optional(),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  metadata: z.record(z.string(), z.unknown()).default({}),
});

export type TraceabilityEventInput = z.infer<typeof traceabilityEventSchema>;

export function toTraceabilityRpcPayload(value: TraceabilityEventInput) {
  return Object.fromEntries(Object.entries({
    application_source: value.applicationSource, condition_severity: value.conditionSeverity,
    correction_of_event_id: value.correctionOfEventId, correction_reason: value.correctionReason,
    country_code: value.countryCode, delay_reason: value.delayReason, device_id: value.deviceId,
    driver_id: value.driverId, eta: value.eta, event_source: value.eventSource, event_type: value.eventType,
    hub_id: value.hubId, idempotency_key: value.idempotencyKey, intervention_owner_id: value.interventionOwnerId,
    latitude: value.latitude, location_accuracy: value.locationAccuracy, location_source: value.locationSource,
    longitude: value.longitude, metadata: value.metadata, mission_id: value.missionId,
    new_custodian_id: value.newCustodianId, new_custodian_type: value.newCustodianType,
    new_location_id: value.newLocationId, next_location_id: value.nextLocationId, next_stage: value.nextStage,
    notes: value.notes, occurred_at: value.occurredAt, parcel_condition: value.parcelCondition,
    parcel_id: value.parcelId, previous_custodian_id: value.previousCustodianId, proof_ids: value.proofIds,
    recorded_by_role: value.recordedByRole, relay_id: value.relayId, stage_after: value.stageAfter,
    traveler_id: value.travelerId, vehicle_id: value.vehicleId,
  }).filter(([, item]) => item !== undefined));
}

export const offlineTraceabilityBatchSchema = z.object({
  events: z.array(traceabilityEventSchema).min(1).max(100),
});

export const parcelSealActionSchema = z.object({
  action: z.enum(["apply", "break"]),
  parcelId: z.string().uuid(),
  sealHash: z.string().regex(/^[a-f0-9]{64}$/i),
  locationId: z.string().trim().min(1).max(160),
  photoProofId: z.string().uuid(),
  reason: z.string().trim().min(8).max(500).optional(),
  authorized: z.boolean().default(false),
  idempotencyKey: z.string().trim().min(12).max(200),
}).superRefine((value, context) => {
  if (value.action === "break" && !value.reason) context.addIssue({ code: "custom", path: ["reason"], message: "Le motif de rupture est obligatoire." });
});
