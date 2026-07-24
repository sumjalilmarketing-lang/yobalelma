import type { PaymentStatus } from "./providers";

const transitions: Record<PaymentStatus, readonly PaymentStatus[]> = {
  created: ["pending", "awaiting_customer_validation", "failed", "cancelled"],
  pending: ["awaiting_customer_validation", "processing", "succeeded", "failed", "expired", "cancelled"],
  awaiting_customer_validation: ["processing", "succeeded", "failed", "expired", "cancelled"],
  processing: ["succeeded", "failed", "expired"],
  succeeded: ["refund_pending", "partially_refunded", "refunded"],
  failed: [], expired: [], cancelled: [],
  refund_pending: ["partially_refunded", "refunded", "succeeded"],
  partially_refunded: ["refund_pending", "refunded"],
  refunded: [],
  payout_pending: ["payout_succeeded", "payout_failed"],
  payout_succeeded: [],
  payout_failed: ["payout_pending"],
};

export function canTransitionPayment(from: PaymentStatus, to: PaymentStatus) {
  return from === to || transitions[from].includes(to);
}

export function assertPaymentOwnership(customerId: string, authenticatedUserId: string, shipmentCustomerId: string) {
  if (customerId !== authenticatedUserId || shipmentCustomerId !== authenticatedUserId) throw new Error("payment_ownership_mismatch");
}

export function validateRefund(input: { amount: number; alreadyRefunded: number; paymentAmount: number; paymentStatus: PaymentStatus }) {
  if (input.paymentStatus !== "succeeded" && input.paymentStatus !== "partially_refunded") throw new Error("payment_not_refundable");
  if (!Number.isSafeInteger(input.amount) || input.amount <= 0 || input.amount + input.alreadyRefunded > input.paymentAmount) throw new Error("invalid_refund_amount");
  return input.amount + input.alreadyRefunded === input.paymentAmount ? "refunded" as const : "partially_refunded" as const;
}

export function payoutNeedsDualApproval(amount: number, threshold: number) {
  if (!Number.isSafeInteger(amount) || amount <= 0 || !Number.isSafeInteger(threshold) || threshold <= 0) throw new Error("invalid_payout_amount");
  return amount >= threshold;
}

export function canReleasePayout(input: { amount: number; approvedBy: string | null; initiatedBy: string; secondApprovedBy: string | null; threshold: number }) {
  if (!input.approvedBy || input.approvedBy === input.initiatedBy) return false;
  if (!payoutNeedsDualApproval(input.amount, input.threshold)) return true;
  return Boolean(input.secondApprovedBy && input.secondApprovedBy !== input.approvedBy && input.secondApprovedBy !== input.initiatedBy);
}
