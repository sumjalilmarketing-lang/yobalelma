export const traceabilityEventTypes = [
  "parcel_created",
  "shipment_created",
  "tracking_number_generated",
  "payment_pending",
  "payment_confirmed",
  "payment_failed",
  "parcel_scanned",
  "custody_transfer_requested",
  "custody_transfer_started",
  "custody_transfer_confirmed",
  "custody_transfer_rejected",
  "driver_assigned",
  "mission_accepted",
  "driver_en_route",
  "driver_arrived",
  "parcel_deposited",
  "parcel_received_at_relay",
  "parcel_collected",
  "parcel_loaded",
  "vehicle_departed",
  "parcel_in_transit",
  "vehicle_arrived",
  "parcel_received_at_hub",
  "parcel_sorted",
  "parcel_stored",
  "parcel_released_from_hub",
  "parcel_handed_to_traveler",
  "customs_pending",
  "customs_document_requested",
  "customs_document_received",
  "customs_cleared",
  "customs_blocked",
  "parcel_arrived_destination_country",
  "parcel_received_at_destination_hub",
  "last_mile_assigned",
  "parcel_out_for_delivery",
  "parcel_available_at_relay",
  "recipient_notified",
  "delivery_attempted",
  "delivery_failed",
  "parcel_delivered",
  "parcel_collected_by_recipient",
  "parcel_return_requested",
  "parcel_returned",
  "parcel_damaged",
  "parcel_lost_suspected",
  "parcel_found",
  "incident_opened",
  "incident_resolved",
  "proof_added",
  "correction_recorded",
  "event_cancelled",
  "tracking_closed",
] as const;

export type TraceabilityEventType = (typeof traceabilityEventTypes)[number];

export const custodyStages = [
  "created",
  "at_origin_relay",
  "with_collection_driver",
  "at_origin_hub",
  "with_traveler",
  "at_destination_hub",
  "with_last_mile_driver",
  "at_destination_relay",
  "delivered",
  "returning",
  "returned",
  "closed",
] as const;

export type CustodyStage = (typeof custodyStages)[number];

const allowedStageTransitions: Record<CustodyStage, readonly CustodyStage[]> = {
  created: ["at_origin_relay", "with_collection_driver", "closed"],
  at_origin_relay: ["with_collection_driver", "returning"],
  with_collection_driver: ["at_origin_hub", "at_destination_relay", "returning"],
  at_origin_hub: ["with_traveler", "at_destination_hub", "returning"],
  with_traveler: ["at_destination_hub", "returning"],
  at_destination_hub: ["with_last_mile_driver", "at_destination_relay", "returning"],
  with_last_mile_driver: ["at_destination_relay", "delivered", "returning"],
  at_destination_relay: ["with_last_mile_driver", "delivered", "returning"],
  delivered: ["closed"],
  returning: ["returned"],
  returned: ["closed"],
  closed: [],
};

export type TransitionInput = {
  currentStage: CustodyStage;
  nextStage: CustodyStage;
  currentCustodianId: string | null;
  previousCustodianId: string | null;
  newCustodianId: string | null;
  proofCount: number;
  requiredProofCount: number;
  missionId?: string | null;
  finalDelivery?: boolean;
};

export type TransitionValidation =
  | { ok: true }
  | { ok: false; code: "invalid_stage" | "custodian_mismatch" | "missing_custodian" | "missing_mission" | "missing_proof" | "duplicate_delivery"; message: string };

export function validateCustodyTransition(input: TransitionInput): TransitionValidation {
  if (!allowedStageTransitions[input.currentStage].includes(input.nextStage)) {
    return { ok: false, code: input.currentStage === "delivered" && input.nextStage === "delivered" ? "duplicate_delivery" : "invalid_stage", message: `Transition interdite: ${input.currentStage} -> ${input.nextStage}.` };
  }
  if (input.currentCustodianId !== input.previousCustodianId) {
    return { ok: false, code: "custodian_mismatch", message: "Le remettant ne correspond pas au detenteur courant." };
  }
  if (!input.newCustodianId) {
    return { ok: false, code: "missing_custodian", message: "Le nouveau detenteur est obligatoire." };
  }
  if (!input.missionId && !["at_origin_relay", "at_destination_relay", "delivered", "closed"].includes(input.nextStage)) {
    return { ok: false, code: "missing_mission", message: "Une mission est obligatoire pour ce transfert." };
  }
  if (input.proofCount < input.requiredProofCount) {
    return { ok: false, code: "missing_proof", message: "Les preuves obligatoires ne sont pas toutes presentes." };
  }
  return { ok: true };
}

export type TrustSignal = {
  key: string;
  label: string;
  weight: number;
  satisfied: boolean;
};

export function calculateTraceabilityTrust(signals: readonly TrustSignal[]) {
  const totalWeight = signals.reduce((sum, signal) => sum + Math.max(0, signal.weight), 0);
  const earnedWeight = signals.reduce((sum, signal) => sum + (signal.satisfied ? Math.max(0, signal.weight) : 0), 0);
  const score = totalWeight === 0 ? 0 : Math.round((earnedWeight / totalWeight) * 100);
  return {
    score,
    reasons: signals.filter((signal) => !signal.satisfied).map((signal) => signal.label),
    evidence: signals.map((signal) => ({ key: signal.key, satisfied: signal.satisfied, weight: signal.weight })),
  };
}

export type TraceabilityObservation = {
  currentCustodianId: string | null;
  nextStage: string | null;
  lastEventAt: string;
  latestLatitude?: number | null;
  latestLongitude?: number | null;
  previousEventAt?: string | null;
  previousLatitude?: number | null;
  previousLongitude?: number | null;
  duplicateEventKey?: boolean;
  requiredProofMissing?: boolean;
  deliveredWithoutFinalProof?: boolean;
  sealBrokenUnexpectedly?: boolean;
};

export function detectTraceabilityAnomalies(observation: TraceabilityObservation, now = new Date()) {
  const anomalies: Array<{ code: string; severity: "medium" | "high" | "critical"; message: string }> = [];
  if (!observation.currentCustodianId) anomalies.push({ code: "missing_custodian", severity: "critical", message: "Colis sans detenteur courant." });
  if (!observation.nextStage) anomalies.push({ code: "missing_next_stage", severity: "high", message: "Prochaine etape absente." });
  if (observation.duplicateEventKey) anomalies.push({ code: "duplicate_event", severity: "high", message: "Evenement duplique detecte." });
  if (observation.requiredProofMissing) anomalies.push({ code: "missing_proof", severity: "critical", message: "Transfert sans preuve obligatoire." });
  if (observation.deliveredWithoutFinalProof) anomalies.push({ code: "delivery_without_proof", severity: "critical", message: "Livraison declaree sans preuve finale." });
  if (observation.sealBrokenUnexpectedly) anomalies.push({ code: "unexpected_seal_break", severity: "critical", message: "Scelle rompu sans autorisation." });
  const ageMs = now.getTime() - new Date(observation.lastEventAt).getTime();
  if (Number.isFinite(ageMs) && ageMs > 24 * 60 * 60 * 1000) anomalies.push({ code: "stale_tracking", severity: "medium", message: "Aucun evenement depuis plus de 24 heures." });
  return anomalies;
}
