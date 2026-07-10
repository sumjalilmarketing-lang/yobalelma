import { describe, expect, it } from "vitest";
import { relayPointSchema, relayScanSchema } from "@/lib/validation/relay";

describe("relay validation", () => {
  it("accepts a relay point", () => {
    const result = relayPointSchema.parse({
      addressLine1: "12 avenue du Port",
      capacitySlots: 120,
      city: "Dakar",
      contactName: "Awa",
      contactPhone: "+221770000000",
      country: "Senegal",
      name: "Relais Plateau",
      postalCode: "",
    });

    expect(result.name).toBe("Relais Plateau");
  });

  it("accepts a valid relay scan", () => {
    const result = relayScanSchema.parse({
      note: "Colis depose au comptoir.",
      relayPointId: "00000000-0000-4000-8000-000000000001",
      scanType: "check_in",
      trackingCode: "YBL-12AB34CD",
    });

    expect(result.scanType).toBe("check_in");
  });

  it("rejects malformed tracking codes", () => {
    expect(() =>
      relayScanSchema.parse({
        relayPointId: "00000000-0000-4000-8000-000000000001",
        scanType: "check_in",
        trackingCode: "BAD-123",
      }),
    ).toThrow();
  });
});
