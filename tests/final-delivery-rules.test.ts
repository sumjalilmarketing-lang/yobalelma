import { describe, expect, it } from "vitest";
import {
  canReleaseFinalDriverPayout,
  canReleaseTravelerPayout,
  canTransitionFinalDelivery,
  deliveryOtpPolicy,
  isBlockingDeliveryFailure,
  maskRecipientName,
  statusForDeliveryMode,
} from "@/lib/final-delivery/rules";

describe("final destination delivery rules", () => {
  it("enforces secure OTP policy limits", () => {
    expect(deliveryOtpPolicy.ttlMinutes).toBe(15);
    expect(deliveryOtpPolicy.maxAttempts).toBeLessThanOrEqual(5);
    expect(deliveryOtpPolicy.maxResends).toBe(3);
    expect(deliveryOtpPolicy.temporaryBlockMinutes).toBeGreaterThan(0);
  });

  it("allows only valid final delivery transitions", () => {
    expect(canTransitionFinalDelivery("destination_batch_received", "destination_package_confirmed")).toBe(true);
    expect(canTransitionFinalDelivery("awaiting_recipient_pickup", "delivered")).toBe(true);
    expect(canTransitionFinalDelivery("delivered", "out_for_delivery")).toBe(false);
    expect(canTransitionFinalDelivery("destination_package_damaged", "delivered")).toBe(false);
  });

  it("maps delivery choice to the expected operational status", () => {
    expect(statusForDeliveryMode("relay_pickup")).toBe("awaiting_recipient_pickup");
    expect(statusForDeliveryMode("home_delivery")).toBe("awaiting_final_delivery");
  });

  it("blocks payouts when anomalies or missing proof remain", () => {
    expect(
      canReleaseTravelerPayout({
        allPackagesControlled: true,
        anomalyCount: 0,
      }),
    ).toBe(true);
    expect(
      canReleaseTravelerPayout({
        allPackagesControlled: true,
        anomalyCount: 1,
      }),
    ).toBe(false);
    expect(
      canReleaseFinalDriverPayout({
        missionCompleted: true,
        proofRecorded: true,
      }),
    ).toBe(true);
    expect(
      canReleaseFinalDriverPayout({
        missionCompleted: true,
        proofRecorded: false,
      }),
    ).toBe(false);
  });

  it("classifies blocking delivery failures", () => {
    expect(isBlockingDeliveryFailure("delivery_blocked")).toBe(true);
    expect(isBlockingDeliveryFailure("return_requested")).toBe(true);
    expect(isBlockingDeliveryFailure("recipient_absent")).toBe(false);
  });

  it("masks recipient identity for public proof summaries", () => {
    expect(maskRecipientName("Awa Diop")).toBe("A***");
    expect(maskRecipientName(null)).toBeNull();
  });
});
