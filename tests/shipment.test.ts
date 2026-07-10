import { describe, expect, it } from "vitest";
import {
  buildDigitalParcelTwin,
  detectShipmentScope,
  estimateShipment,
} from "@/lib/shipments/estimation";
import { shipmentSchema, type ShipmentInput } from "@/lib/validation/shipment";

const validShipment: ShipmentInput = {
  senderName: "Awa Diop",
  senderPhone: "+221770000000",
  senderEmail: "awa@example.com",
  pickupAddressLine1: "12 rue de Paris",
  pickupAddressLine2: "",
  pickupCity: "Paris",
  pickupPostalCode: "75010",
  pickupCountry: "France",
  pickupInstructions: "",
  recipientName: "Moussa Ba",
  recipientPhone: "+221780000000",
  recipientEmail: "",
  deliveryAddressLine1: "Plateau",
  deliveryAddressLine2: "",
  deliveryCity: "Dakar",
  deliveryPostalCode: "",
  deliveryCountry: "Senegal",
  deliveryInstructions: "",
  packageTitle: "Documents",
  packageCategory: "documents",
  packageDescription: "Documents administratifs sous enveloppe protegee.",
  weightKg: 2,
  lengthCm: 30,
  widthCm: 20,
  heightCm: 5,
  declaredValueCents: 0,
  fragile: false,
  serviceLevel: "standard",
  preferredPickupDate: "2026-08-01",
  latestDeliveryDate: "2026-08-10",
  prohibitedItemsConfirmed: true,
  confirmationAccepted: true,
};

describe("shipment workflow", () => {
  it("detects national and international shipments", () => {
    expect(detectShipmentScope("France", "france")).toBe("national");
    expect(detectShipmentScope("France", "Senegal")).toBe("international");
  });

  it("validates a complete shipment request", () => {
    expect(shipmentSchema.parse(validShipment).packageTitle).toBe("Documents");
  });

  it("requires final confirmation before creation", () => {
    expect(() =>
      shipmentSchema.parse({
        ...validShipment,
        confirmationAccepted: false,
      }),
    ).toThrow();
  });

  it("estimates price and ETA from route and package", () => {
    const estimate = estimateShipment(validShipment);

    expect(estimate.scope).toBe("international");
    expect(estimate.priceCents).toBeGreaterThan(0);
    expect(estimate.etaMaxDays).toBeGreaterThanOrEqual(estimate.etaMinDays);
  });

  it("builds a digital parcel twin", () => {
    const estimate = estimateShipment(validShipment);
    const twin = buildDigitalParcelTwin(validShipment, estimate);

    expect(twin.version).toBe(1);
    expect(twin.route.scope).toBe("international");
    expect(twin.package.weightKg).toBe(2);
  });
});
