import { describe, expect, it } from "vitest";
import {
  isValidTrackingCode,
  normalizeTrackingCode,
  toPublicTrackingShipment,
} from "@/lib/tracking/public-view";

describe("public tracking", () => {
  it("normalizes user-entered tracking codes", () => {
    expect(normalizeTrackingCode(" ybl1234abcd ")).toBe("YBL-1234ABCD");
    expect(normalizeTrackingCode("ybl-1234abcd")).toBe("YBL-1234ABCD");
  });

  it("accepts only Yobalelma tracking codes", () => {
    expect(isValidTrackingCode("YBL-1234ABCD")).toBe(true);
    expect(isValidTrackingCode("YBL1234ABCD")).toBe(true);
    expect(isValidTrackingCode("AFR-1234ABCD")).toBe(false);
    expect(isValidTrackingCode("YBL-123")).toBe(false);
  });

  it("returns only privacy-safe public shipment fields", () => {
    const shipment = toPublicTrackingShipment(
      {
        created_at: "2026-07-12T08:00:00.000Z",
        destination_city: "Paris",
        destination_country: "France",
        eta_max_days: 6,
        eta_min_days: 3,
        id: "shipment-1",
        origin_city: "Dakar",
        origin_country: "Senegal",
        scope: "international",
        status: "in_transit",
        tracking_code: "YBL-1234ABCD",
        updated_at: "2026-07-12T09:00:00.000Z",
      },
      [
        {
          created_at: "2026-07-12T09:00:00.000Z",
          id: "event-1",
          status: "in_transit",
        },
      ],
      [
        {
          created_at: "2026-07-13T09:00:00.000Z",
          event_type: "destination_batch_received",
          id: "delivery-event-1",
          status: "destination_batch_received",
        },
      ],
    );

    expect(shipment).toMatchObject({
      destination: "Paris, France",
      eta: "3-6 jours",
      origin: "Dakar, Senegal",
      statusLabel: "En transit",
      trackingCode: "YBL-1234ABCD",
    });
    expect(shipment.events[0].label).toBe("Arrive dans le pays de destination");
    expect(JSON.stringify(shipment)).not.toMatch(/phone|address|otp|declared|sender|recipient/i);
  });
});
