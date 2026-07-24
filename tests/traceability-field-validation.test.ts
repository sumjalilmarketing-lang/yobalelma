import { describe, expect, it } from "vitest";
import { auditFieldRecipe, decideSensitiveTransfer, fieldRecipe, requestSensitiveTransfer, type FieldAuditEvent } from "@/lib/traceability/field-validation";

const requested = () => requestSensitiveTransfer({
  id: "transfer-1",
  parcelId: "parcel-1",
  stageBefore: "at_origin_relay",
  stageAfter: "with_collection_driver",
  currentCustodianId: "relay-1",
  giverId: "relay-1",
  receiverId: "driver-1",
  requestedAt: "2026-07-24T10:00:00Z",
  expiresAt: "2026-07-24T10:15:00Z",
  latitude: 14.7167,
  longitude: -17.4677,
  requiredProofTypes: ["qr", "server_confirmation", "gps"],
  proofTypes: ["qr", "server_confirmation", "gps"],
});

describe("sensitive custody transfer", () => {
  it("keeps custody pending after the giver confirmation and finalizes after the receiver confirmation", () => {
    const pending = requested();
    expect(pending).toMatchObject({ status: "pending", giverConfirmedAt: "2026-07-24T10:00:00Z", receiverConfirmedAt: null });
    const result = decideSensitiveTransfer(pending, { actorId: "driver-1", decision: "confirm", decisionKey: "decision-1", decidedAt: "2026-07-24T10:02:00Z", latitude: 14.7168, longitude: -17.4678 });
    expect(result).toMatchObject({ ok: true, replay: false, transfer: { status: "confirmed", receiverConfirmedAt: "2026-07-24T10:02:00Z" } });
  });

  it("handles refusal, expiration, replay, wrong actor and incoherent position", () => {
    expect(decideSensitiveTransfer(requested(), { actorId: "driver-1", decision: "reject", rejectionReason: "Scellé altéré", decisionKey: "reject-1", decidedAt: "2026-07-24T10:01:00Z", latitude: 14.7167, longitude: -17.4677 })).toMatchObject({ ok: true, transfer: { status: "rejected" } });
    expect(decideSensitiveTransfer(requested(), { actorId: "driver-1", decision: "confirm", decisionKey: "late-1", decidedAt: "2026-07-24T10:16:00Z", latitude: 14.7167, longitude: -17.4677 })).toMatchObject({ ok: false, code: "expired", transfer: { status: "expired" } });
    expect(decideSensitiveTransfer(requested(), { actorId: "intruder", decision: "confirm", decisionKey: "wrong-1", decidedAt: "2026-07-24T10:01:00Z", latitude: 14.7167, longitude: -17.4677 })).toMatchObject({ ok: false, code: "actor_mismatch" });
    expect(decideSensitiveTransfer(requested(), { actorId: "driver-1", decision: "confirm", decisionKey: "far-1", decidedAt: "2026-07-24T10:01:00Z", latitude: 15.5, longitude: -17.4677 })).toMatchObject({ ok: false, code: "invalid_location" });
    const confirmed = decideSensitiveTransfer(requested(), { actorId: "driver-1", decision: "confirm", decisionKey: "same-1", decidedAt: "2026-07-24T10:01:00Z", latitude: 14.7167, longitude: -17.4677 });
    if (!confirmed.ok) throw new Error("confirmation failed");
    expect(decideSensitiveTransfer(confirmed.transfer, { actorId: "driver-1", decision: "confirm", decisionKey: "same-1", decidedAt: "2026-07-24T10:01:01Z", latitude: 14.7167, longitude: -17.4677 })).toMatchObject({ ok: true, replay: true });
    expect(decideSensitiveTransfer(confirmed.transfer, { actorId: "driver-1", decision: "confirm", decisionKey: "other-1", decidedAt: "2026-07-24T10:01:01Z", latitude: 14.7167, longitude: -17.4677 })).toMatchObject({ ok: false, code: "already_finalized" });
  });

  it("rejects a current-custodian mismatch and missing proofs", () => {
    expect(() => requestSensitiveTransfer({ ...requested(), currentCustodianId: "other", requestedAt: "2026-07-24T10:00:00Z", latitude: 14.7167, longitude: -17.4677 })).toThrow("giver_must_be_current_custodian");
    const transfer = { ...requested(), proofTypes: ["qr", "gps"] as const };
    expect(decideSensitiveTransfer(transfer, { actorId: "driver-1", decision: "confirm", decisionKey: "proof-1", decidedAt: "2026-07-24T10:01:00Z", latitude: 14.7167, longitude: -17.4677 })).toMatchObject({ ok: false, code: "missing_proof" });
  });
});

describe("field recipe audit", () => {
  it("accepts one complete, proved and doubly validated chain", () => {
    const events: FieldAuditEvent[] = fieldRecipe.map((item, index) => ({
      sequence: index + 1,
      eventType: item.stageAfter === "delivered" ? "parcel_delivered" : item.stageAfter === "with_traveler" ? "parcel_handed_to_traveler" : "custody_transfer_confirmed",
      stageBefore: item.stageBefore,
      stageAfter: item.stageAfter,
      previousHash: index === 0 ? null : `hash-${index}`,
      hash: `hash-${index + 1}`,
      idempotencyKey: `transfer-${index + 1}`,
      proofTypes: item.requiredProofTypes,
      dualValidation: true,
      passportUpdated: true,
      digitalTwinUpdated: true,
      controlTowerUpdated: true,
    }));
    expect(auditFieldRecipe(events)).toEqual({ ok: true, failures: [] });
  });

  it("reports missing evidence and downstream updates", () => {
    const first = fieldRecipe[0];
    const result = auditFieldRecipe([{ sequence: 1, eventType: "custody_transfer_confirmed", stageBefore: first.stageBefore, stageAfter: first.stageAfter, previousHash: null, hash: "hash-1", idempotencyKey: "one", proofTypes: ["qr"], dualValidation: false, passportUpdated: true, digitalTwinUpdated: false, controlTowerUpdated: false }]);
    expect(result.ok).toBe(false);
    expect(result.failures).toEqual(expect.arrayContaining(["incomplete_chain", `proof:${first.id}`, `dual:${first.id}`, `digital-twin:${first.id}`, `control-tower:${first.id}`, "final_proof"]));
  });
});
