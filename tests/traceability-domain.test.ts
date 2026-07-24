import { describe, expect, it } from "vitest";
import { calculateTraceabilityTrust, detectTraceabilityAnomalies, validateCustodyTransition } from "@/lib/traceability/domain";

describe("parcel chain of custody", () => {
  it("accepts a proved, assigned transfer", () => {
    expect(validateCustodyTransition({ currentStage: "with_collection_driver", nextStage: "at_origin_hub", currentCustodianId: "driver", previousCustodianId: "driver", newCustodianId: "hub", missionId: "mission", proofCount: 2, requiredProofCount: 2 })).toEqual({ ok: true });
  });

  it.each([
    [{ currentStage: "created", nextStage: "delivered", currentCustodianId: "sender", previousCustodianId: "sender", newCustodianId: "recipient", proofCount: 1, requiredProofCount: 1 }, "invalid_stage"],
    [{ currentStage: "at_origin_relay", nextStage: "with_collection_driver", currentCustodianId: "relay-a", previousCustodianId: "relay-b", newCustodianId: "driver", missionId: "mission", proofCount: 1, requiredProofCount: 1 }, "custodian_mismatch"],
    [{ currentStage: "at_origin_hub", nextStage: "with_traveler", currentCustodianId: "hub", previousCustodianId: "hub", newCustodianId: "traveler", missionId: "mission", proofCount: 0, requiredProofCount: 1 }, "missing_proof"],
    [{ currentStage: "delivered", nextStage: "delivered", currentCustodianId: "recipient", previousCustodianId: "recipient", newCustodianId: "recipient", proofCount: 1, requiredProofCount: 1 }, "duplicate_delivery"],
  ] as const)("rejects unsafe transition %#", (input, code) => {
    expect(validateCustodyTransition(input)).toMatchObject({ ok: false, code });
  });
});

describe("traceability trust and anomalies", () => {
  it("calculates an explainable weighted score", () => {
    expect(calculateTraceabilityTrust([{ key: "sequence", label: "Sequence incomplete", weight: 50, satisfied: true }, { key: "proof", label: "Preuve manquante", weight: 30, satisfied: false }, { key: "fresh", label: "Donnees anciennes", weight: 20, satisfied: true }])).toEqual({ score: 70, reasons: ["Preuve manquante"], evidence: [{ key: "sequence", satisfied: true, weight: 50 }, { key: "proof", satisfied: false, weight: 30 }, { key: "fresh", satisfied: true, weight: 20 }] });
  });

  it("raises custody, proof, seal and freshness anomalies", () => {
    const anomalies = detectTraceabilityAnomalies({ currentCustodianId: null, nextStage: null, lastEventAt: "2026-07-20T00:00:00Z", requiredProofMissing: true, deliveredWithoutFinalProof: true, sealBrokenUnexpectedly: true }, new Date("2026-07-22T12:00:00Z"));
    expect(anomalies.map((item) => item.code)).toEqual(["missing_custodian", "missing_next_stage", "missing_proof", "delivery_without_proof", "unexpected_seal_break", "stale_tracking"]);
  });
});
