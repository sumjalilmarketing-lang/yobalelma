import { describe, expect, it } from "vitest";
import {
  hubBatchAssignmentSchema,
  hubBatchSchema,
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
      destinationHub: "Dakar Hub",
      flightNumber: "AF000",
      originHub: "Paris Hub",
    });

    expect(result.code).toBe("HUB-CDGDSS01");
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
});
