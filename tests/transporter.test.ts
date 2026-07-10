import { describe, expect, it } from "vitest";
import {
  transporterAvailabilitySchema,
  transporterProfileSchema,
  transporterVehicleSchema,
  transporterZoneSchema,
} from "@/lib/validation/transporter";

describe("local transporter validation", () => {
  it("accepts a complete transporter profile", () => {
    const result = transporterProfileSchema.parse({
      baseCity: "Dakar",
      baseCountry: "Senegal",
      bio: "Collecte et livraison locale dans Dakar.",
      businessName: "Yobalelma Dakar Express",
      maxWeightKg: 80,
    });

    expect(result.baseCity).toBe("Dakar");
  });

  it("accepts a compatible vehicle", () => {
    const result = transporterVehicleSchema.parse({
      capacityKg: 120,
      label: "Fourgon principal",
      plateNumber: "DK-123",
      type: "van",
    });

    expect(result.type).toBe("van");
  });

  it("accepts a delivery zone", () => {
    const result = transporterZoneSchema.parse({
      city: "Dakar",
      country: "Senegal",
      radiusKm: 35,
    });

    expect(result.radiusKm).toBe(35);
  });

  it("rejects invalid availability windows", () => {
    expect(() =>
      transporterAvailabilitySchema.parse({
        availableOn: "2026-08-01",
        startsAt: "18:00",
        endsAt: "09:00",
      }),
    ).toThrow();
  });
});
