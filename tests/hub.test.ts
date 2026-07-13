import { describe, expect, it } from "vitest";
import {
  assertCapacityReservation,
  assertHandoverChecks,
  assertSingleActiveStorageLocation,
  evaluateWeightTolerance,
  summarizeManifest,
} from "@/lib/hub/workflows";
import {
  hubAdvancedInspectionSchema,
  hubBatchAssignmentSchema,
  hubBatchSchema,
  hubHandoverEventSchema,
  hubInboundReceiptSchema,
  hubIncidentSchema,
  hubStorageMoveSchema,
  travelDocumentSchema,
} from "@/lib/validation/hub";

describe("hub and traveler validation", () => {
  it("accepts a travel document", () => {
    const result = travelDocumentSchema.parse({
      arrivalAirport: "DSS",
      arrivalDate: "2026-08-02",
      departureAirport: "CDG",
      departureDate: "2026-08-01",
      documentNumber: "PA123456",
      filePath: "travel/user/ticket.pdf",
      issuingCountry: "Senegal",
      travelerName: "Awa Diop",
      tripId: "00000000-0000-4000-8000-000000000001",
    });

    expect(result.arrivalAirport).toBe("DSS");
  });

  it("accepts a hub batch", () => {
    const result = hubBatchSchema.parse({
      capacityKg: 120,
      code: "HUB-CDGDSS01",
      departureDate: "2026-08-01",
      destinationCity: "Dakar",
      destinationCountry: "Senegal",
      destinationHub: "Dakar Hub",
      flightNumber: "AF000",
      hubId: "00000000-0000-4000-8000-000000000010",
      originHub: "Paris Hub",
    });

    expect(result.code).toBe("HUB-CDGDSS01");
    expect(result.destinationCountry).toBe("Senegal");
  });

  it("rejects malformed hub batch codes", () => {
    expect(() =>
      hubBatchSchema.parse({
        capacityKg: 120,
        code: "BAD",
        departureDate: "2026-08-01",
        destinationHub: "Dakar Hub",
        originHub: "Paris Hub",
      }),
    ).toThrow();
  });

  it("accepts a capacity reservation", () => {
    const result = hubBatchAssignmentSchema.parse({
      batchId: "00000000-0000-4000-8000-000000000001",
      reservedWeightKg: 2.5,
      shipmentId: "00000000-0000-4000-8000-000000000002",
    });

    expect(result.reservedWeightKg).toBe(2.5);
  });

  it("summarizes a clean inbound manifest", () => {
    const summary = summarizeManifest([
      { status: "received_at_hub" },
      { status: "received_at_hub" },
    ]);

    expect(summary).toMatchObject({
      canConfirm: true,
      expected: 2,
      received: 2,
      unresolvedDiscrepancies: 0,
    });
  });

  it("blocks manifest confirmation when discrepancies are not justified", () => {
    const summary = summarizeManifest([
      { status: "missing_at_hub" },
      { note: "Carton abime sur la tranche", status: "damaged_at_hub" },
    ]);

    expect(summary.canConfirm).toBe(false);
    expect(summary.unresolvedDiscrepancies).toBe(1);
  });

  it("classifies weight tolerance as ok, alert or blocked", () => {
    expect(
      evaluateWeightTolerance({ declaredWeightKg: 10, measuredWeightKg: 10.4 }).tone,
    ).toBe("ok");

    expect(
      evaluateWeightTolerance({ declaredWeightKg: 10, measuredWeightKg: 10.8 }).tone,
    ).toBe("alert");

    expect(
      evaluateWeightTolerance({ declaredWeightKg: 10, measuredWeightKg: 12 }).tone,
    ).toBe("blocked");
  });

  it("approves a compatible capacity reservation", () => {
    const result = assertCapacityReservation({
      batchCapacityKg: 30,
      batchDestinationCountry: "Senegal",
      currentReservedKg: 12,
      shipmentDestinationCountry: "senegal",
      shipmentWeightKg: 4,
    });

    expect(result.remainingAfterKg).toBe(14);
  });

  it("rejects destination mismatch, capacity overflow and double reservation", () => {
    expect(() =>
      assertCapacityReservation({
        batchCapacityKg: 30,
        batchDestinationCountry: "France",
        currentReservedKg: 12,
        shipmentDestinationCountry: "Senegal",
        shipmentWeightKg: 4,
      }),
    ).toThrow(/destination/i);

    expect(() =>
      assertCapacityReservation({
        batchCapacityKg: 15,
        currentReservedKg: 12,
        shipmentWeightKg: 4,
      }),
    ).toThrow(/capacity/i);

    expect(() =>
      assertCapacityReservation({
        alreadyReserved: true,
        batchCapacityKg: 30,
        currentReservedKg: 12,
        shipmentWeightKg: 4,
      }),
    ).toThrow(/active batch/i);
  });

  it("prevents impossible storage movements", () => {
    expect(
      assertSingleActiveStorageLocation({
        activeLocationsForShipment: 1,
        fromHubId: "hub-a",
        toHubId: "hub-a",
      }),
    ).toBe(true);

    expect(() =>
      assertSingleActiveStorageLocation({
        activeLocationsForShipment: 2,
        toHubId: "hub-a",
      }),
    ).toThrow(/two hub locations/i);
  });

  it("requires all handover checks before traveler release", () => {
    expect(
      assertHandoverChecks({
        verifiedDocument: true,
        verifiedIdentity: true,
        verifiedTicket: true,
      }),
    ).toBe(true);

    expect(() =>
      assertHandoverChecks({
        verifiedDocument: false,
        verifiedIdentity: true,
        verifiedTicket: true,
      }),
    ).toThrow(/required/i);
  });

  it("accepts new hub operation payloads", () => {
    const hubId = "00000000-0000-4000-8000-000000000010";
    const shipmentId = "00000000-0000-4000-8000-000000000011";
    const batchId = "00000000-0000-4000-8000-000000000012";

    expect(
      hubInboundReceiptSchema.parse({
        hubId,
        items: [{ status: "received_at_hub", trackingCode: "YBL-TEST-001" }],
      }).items[0].trackingCode,
    ).toBe("YBL-TEST-001");

    expect(
      hubAdvancedInspectionSchema.parse({
        decision: "approved",
        hubId,
        measuredWeightKg: 2.4,
        shipmentId,
      }).decision,
    ).toBe("approved");

    expect(
      hubStorageMoveSchema.parse({
        hubId,
        shipmentId,
        status: "in_storage",
      }).status,
    ).toBe("in_storage");

    expect(
      hubIncidentSchema.parse({
        incidentType: "wrong_weight",
        priority: "high",
        title: "Ecart de poids",
      }).priority,
    ).toBe("high");

    expect(
      hubHandoverEventSchema.parse({
        batchId,
        verifiedDocument: true,
        verifiedIdentity: true,
        verifiedTicket: true,
      }).batchId,
    ).toBe(batchId);
  });
});
