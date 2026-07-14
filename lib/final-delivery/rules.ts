import type {
  FinalDeliveryAdminStatus,
  FinalDeliveryAttemptStatus,
  FinalDeliveryMode,
} from "@/lib/validation/final-delivery";

export const deliveryOtpPolicy = {
  maxAttempts: 5,
  maxResends: 3,
  temporaryBlockMinutes: 15,
  ttlMinutes: 15,
} as const;

export const finalDeliveryTransitions: Record<FinalDeliveryAdminStatus, FinalDeliveryAdminStatus[]> = {
  destination_batch_received: ["destination_package_confirmed", "destination_package_missing", "destination_package_damaged"],
  destination_package_confirmed: ["stored_at_destination_relay"],
  destination_package_missing: ["disputed", "delivery_blocked"],
  destination_package_damaged: ["disputed", "delivery_blocked"],
  stored_at_destination_relay: ["awaiting_recipient_choice", "awaiting_recipient_pickup", "awaiting_final_delivery"],
  awaiting_recipient_choice: ["awaiting_recipient_pickup", "awaiting_final_delivery"],
  awaiting_recipient_pickup: ["ready_for_recipient", "otp_failed", "delivered", "delivery_blocked"],
  awaiting_final_delivery: ["delivery_assigned", "delivery_blocked"],
  ready_for_recipient: ["otp_failed", "delivered", "refused_by_recipient"],
  delivery_assigned: ["out_for_delivery", "returned_to_relay", "delivery_blocked"],
  out_for_delivery: [
    "delivery_attempted",
    "recipient_absent",
    "invalid_address",
    "delivery_rescheduled",
    "returned_to_relay",
    "refused_by_recipient",
    "delivered",
  ],
  delivery_attempted: ["delivery_rescheduled", "returned_to_relay", "delivered", "delivery_blocked"],
  recipient_absent: ["delivery_rescheduled", "returned_to_relay"],
  invalid_address: ["delivery_rescheduled", "return_requested", "delivery_blocked"],
  otp_failed: ["awaiting_recipient_pickup", "ready_for_recipient", "delivery_blocked"],
  delivery_rescheduled: ["out_for_delivery", "returned_to_relay"],
  returned_to_relay: ["awaiting_recipient_pickup", "awaiting_final_delivery", "return_requested"],
  refused_by_recipient: ["return_requested", "disputed"],
  delivery_blocked: ["disputed", "return_requested"],
  return_requested: ["disputed"],
  delivered: [],
  disputed: ["delivery_blocked", "return_requested"],
};

export function canTransitionFinalDelivery(
  from: FinalDeliveryAdminStatus,
  to: FinalDeliveryAdminStatus,
) {
  return finalDeliveryTransitions[from]?.includes(to) ?? false;
}

export function statusForDeliveryMode(mode: FinalDeliveryMode) {
  return mode === "home_delivery" ? "awaiting_final_delivery" : "awaiting_recipient_pickup";
}

export function isBlockingDeliveryFailure(status: FinalDeliveryAttemptStatus) {
  return ["delivery_blocked", "refused_by_recipient", "return_requested"].includes(status);
}

export function canReleaseTravelerPayout(input: {
  allPackagesControlled: boolean;
  anomalyCount: number;
  blockingReason?: string | null;
}) {
  return input.allPackagesControlled && input.anomalyCount === 0 && !input.blockingReason;
}

export function canReleaseFinalDriverPayout(input: {
  missionCompleted: boolean;
  proofRecorded: boolean;
  blockingIncident?: string | null;
}) {
  return input.missionCompleted && input.proofRecorded && !input.blockingIncident;
}

export function maskRecipientName(name?: string | null) {
  if (!name) return null;

  return `${name.trim().slice(0, 1).toUpperCase()}***`;
}

export function isSandboxNotificationProvider(provider: string) {
  return provider === "sandbox";
}
