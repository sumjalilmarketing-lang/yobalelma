import { describe, expect, it } from "vitest";
import {
  paymentIntentSchema,
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
});
