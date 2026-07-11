import { describe, expect, it } from "vitest";
import {
  commissionSchema,
  deliveryProofSchema,
  notificationCreateSchema,
  paymentIntentSchema,
  shipmentDisputeSchema,
  supportMessageSchema,
  supportTicketSchema,
} from "@/lib/validation/operations";

describe("operations validation", () => {
  it("accepts a sandbox payment intent", () => {
    const result = paymentIntentSchema.parse({
      amountCents: 2500,
      currency: "EUR",
      shipmentId: "00000000-0000-4000-8000-000000000001",
    });

    expect(result.amountCents).toBe(2500);
  });

  it("rejects zero payment amounts", () => {
    expect(() =>
      paymentIntentSchema.parse({
        amountCents: 0,
        currency: "EUR",
        shipmentId: "00000000-0000-4000-8000-000000000001",
      }),
    ).toThrow();
  });

  it("accepts a support ticket", () => {
    const result = supportTicketSchema.parse({
      category: "shipment",
      message: "Le colis n'a pas encore ete scanne au relais.",
      priority: "normal",
      shipmentId: "",
      subject: "Suivi du colis",
    });

    expect(result.category).toBe("shipment");
  });

  it("accepts a support message", () => {
    const result = supportMessageSchema.parse({
      message: "Nous verifions le statut avec le relais.",
      ticketId: "00000000-0000-4000-8000-000000000001",
    });

    expect(result.message).toContain("statut");
  });

  it("accepts an in-app notification", () => {
    const result = notificationCreateSchema.parse({
      body: "Votre colis vient d'arriver au hub.",
      recipientId: "00000000-0000-4000-8000-000000000001",
      title: "Colis arrive",
      type: "shipment_update",
    });

    expect(result.channel).toBe("in_app");
  });

  it("accepts a shipment dispute", () => {
    const result = shipmentDisputeSchema.parse({
      category: "damaged_package",
      description: "Le destinataire signale que le colis est arrive endommage.",
      shipmentId: "00000000-0000-4000-8000-000000000001",
      subject: "Colis endommage",
    });

    expect(result.category).toBe("damaged_package");
  });

  it("validates delivery proof recipient phone suffix", () => {
    const result = deliveryProofSchema.parse({
      otpConfirmed: true,
      proofType: "otp",
      recipientPhoneLast4: "1234",
      shipmentId: "00000000-0000-4000-8000-000000000001",
    });

    expect(result.recipientPhoneLast4).toBe("1234");
  });

  it("accepts a platform commission", () => {
    const result = commissionSchema.parse({
      grossAmountCents: 10000,
      paymentIntentId: "00000000-0000-4000-8000-000000000002",
      shipmentId: "00000000-0000-4000-8000-000000000001",
    });

    expect(result.commissionRateBps).toBe(1500);
  });
});
