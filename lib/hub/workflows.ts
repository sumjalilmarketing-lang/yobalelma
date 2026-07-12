export type ManifestItemStatus =
  | "expected_at_hub"
  | "received_at_hub"
  | "partially_received"
  | "missing_at_hub"
  | "damaged_at_hub"
  | "extra_at_hub"
  | "quarantined"
  | "rejected_at_hub";

export type ManifestItem = {
  status: ManifestItemStatus;
  note?: string | null;
};

export type ManifestSummary = {
  expected: number;
  received: number;
  missing: number;
  damaged: number;
  extra: number;
  quarantined: number;
  rejected: number;
  unresolvedDiscrepancies: number;
  canConfirm: boolean;
};

export function summarizeManifest(items: ManifestItem[]): ManifestSummary {
  const summary: ManifestSummary = {
    canConfirm: true,
    damaged: 0,
    expected: 0,
    extra: 0,
    missing: 0,
    quarantined: 0,
    received: 0,
    rejected: 0,
    unresolvedDiscrepancies: 0,
  };

  for (const item of items) {
    if (item.status !== "extra_at_hub") {
      summary.expected += 1;
    }

    if (item.status === "received_at_hub") {
      summary.received += 1;
    }

    if (item.status === "missing_at_hub") {
      summary.missing += 1;
    }

    if (item.status === "damaged_at_hub") {
      summary.damaged += 1;
    }

    if (item.status === "extra_at_hub") {
      summary.extra += 1;
    }

    if (item.status === "quarantined") {
      summary.quarantined += 1;
    }

    if (item.status === "rejected_at_hub") {
      summary.rejected += 1;
    }

    const isDiscrepancy = [
      "missing_at_hub",
      "damaged_at_hub",
      "extra_at_hub",
      "quarantined",
      "rejected_at_hub",
    ].includes(item.status);

    if (isDiscrepancy && !item.note?.trim()) {
      summary.unresolvedDiscrepancies += 1;
    }
  }

  summary.canConfirm = summary.unresolvedDiscrepancies === 0;

  return summary;
}

export type WeightToleranceResult = {
  varianceKg: number;
  variancePercent: number;
  tone: "ok" | "alert" | "blocked";
  requiresIncident: boolean;
  recommendedDecision:
    | "approved"
    | "needs_customer_confirmation"
    | "blocked";
};

export function evaluateWeightTolerance({
  alertThresholdPercent = 5,
  blockThresholdPercent = 15,
  declaredWeightKg,
  measuredWeightKg,
}: {
  alertThresholdPercent?: number;
  blockThresholdPercent?: number;
  declaredWeightKg: number;
  measuredWeightKg: number;
}): WeightToleranceResult {
  if (declaredWeightKg <= 0 || measuredWeightKg <= 0) {
    throw new Error("Weights must be positive.");
  }

  const varianceKg = measuredWeightKg - declaredWeightKg;
  const variancePercent = Math.abs(varianceKg / declaredWeightKg) * 100;

  if (variancePercent > blockThresholdPercent) {
    return {
      recommendedDecision: "blocked",
      requiresIncident: true,
      tone: "blocked",
      varianceKg,
      variancePercent,
    };
  }

  if (variancePercent > alertThresholdPercent) {
    return {
      recommendedDecision: "needs_customer_confirmation",
      requiresIncident: true,
      tone: "alert",
      varianceKg,
      variancePercent,
    };
  }

  return {
    recommendedDecision: "approved",
    requiresIncident: false,
    tone: "ok",
    varianceKg,
    variancePercent,
  };
}

export type CapacityReservationCheck = {
  alreadyReserved?: boolean;
  batchCapacityKg: number;
  batchDestinationCountry?: string | null;
  currentReservedKg: number;
  shipmentDestinationCountry?: string | null;
  shipmentWeightKg: number;
};

export function assertCapacityReservation({
  alreadyReserved = false,
  batchCapacityKg,
  batchDestinationCountry,
  currentReservedKg,
  shipmentDestinationCountry,
  shipmentWeightKg,
}: CapacityReservationCheck) {
  if (alreadyReserved) {
    throw new Error("Shipment already belongs to an active batch.");
  }

  if (batchCapacityKg <= 0 || shipmentWeightKg <= 0 || currentReservedKg < 0) {
    throw new Error("Capacity and weights must be positive.");
  }

  const normalizedBatchCountry = batchDestinationCountry?.trim().toLowerCase();
  const normalizedShipmentCountry = shipmentDestinationCountry?.trim().toLowerCase();

  if (
    normalizedBatchCountry &&
    normalizedShipmentCountry &&
    normalizedBatchCountry !== normalizedShipmentCountry
  ) {
    throw new Error("Shipment destination is incompatible with batch.");
  }

  const remainingAfterKg = batchCapacityKg - currentReservedKg - shipmentWeightKg;

  if (remainingAfterKg < 0) {
    throw new Error("Batch capacity exceeded.");
  }

  return {
    ok: true as const,
    remainingAfterKg,
    reservedAfterKg: currentReservedKg + shipmentWeightKg,
  };
}

export type StorageMoveCheck = {
  activeLocationsForShipment: number;
  fromHubId?: string | null;
  toHubId: string;
};

export function assertSingleActiveStorageLocation({
  activeLocationsForShipment,
  fromHubId,
  toHubId,
}: StorageMoveCheck) {
  if (activeLocationsForShipment > 1) {
    throw new Error("Shipment cannot be active in two hub locations.");
  }

  if (fromHubId && fromHubId !== toHubId) {
    throw new Error("Cross-hub movement requires a collection manifest.");
  }

  return true;
}

export function assertHandoverChecks({
  verifiedDocument,
  verifiedIdentity,
  verifiedTicket,
}: {
  verifiedDocument: boolean;
  verifiedIdentity: boolean;
  verifiedTicket: boolean;
}) {
  if (!verifiedIdentity || !verifiedDocument || !verifiedTicket) {
    throw new Error("Identity, document and ticket verifications are required.");
  }

  return true;
}
