import { describe, expect, it, vi } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";
import { assertPaymentOwnership, canReleasePayout, canTransitionPayment, validateRefund } from "@/lib/payments/policies";
import { OrangeMoneyPaymentProvider, PaymentProviderUnavailableError, TestPaymentProvider, type OrangeMoneyContractMapping, type PaymentContext } from "@/lib/payments/providers";
import { assertFreshWebhook, requireIdempotencyKey, sanitizePaymentPayload } from "@/lib/payments/security";

const payment: PaymentContext = { amount: 12_500, currency: "XOF", customerId: "customer-1", customerPhone: "+221771234567", countryCode: "SN", idempotencyKey: "payment:test:123456", internalReference: "pay_internal_1", shipmentId: "shipment-1" };
const credentials = { baseUrl: "https://sandbox.invalid", clientId: "client", clientSecret: "secret", countryCode: "SN", currency: "XOF", environment: "sandbox" as const, merchantId: "merchant", merchantKey: "key", webhookSecret: "webhook" };
const contract: OrangeMoneyContractMapping = {
  authorize: async () => ({ authorization: "Bearer official-test-token" }),
  buildRequest: ({ body, method }) => ({ body: method === "POST" ? JSON.stringify(body) : undefined, headers: { "content-type": "application/json" }, method }),
  confirmPath: "/confirm", createPath: "/payments", statusPath: (id) => `/payments/${id}`,
  parsePayment: (_payload, input) => ({ amount: "amount" in input ? input.amount : 12_500, currency: "currency" in input ? input.currency : "XOF", customerId: "customerId" in input ? input.customerId : "customer-1", countryCode: "countryCode" in input ? input.countryCode : "SN", idempotencyKey: "idempotencyKey" in input ? input.idempotencyKey : input.internalReference, internalReference: input.internalReference, shipmentId: "shipmentId" in input ? input.shipmentId : "shipment-1", provider: "orange_money", providerTransactionId: "official-transaction", status: "pending" }),
  parseWebhook: () => ({ eventId: "official-event", internalReference: "pay_internal_1", occurredAt: new Date(), providerTransactionId: "official-transaction", status: "succeeded" }),
  verifyWebhook: async () => true,
};

describe("Orange Money production guardrails", () => {
  it("keeps a successful test payment clearly outside the provider network", async () => {
    const provider = new TestPaymentProvider();
    const created = await provider.createPayment(payment);
    const confirmed = await provider.confirmPayment({ internalReference: created.internalReference });
    expect(created.providerTransactionId).toBeNull();
    expect(confirmed.status).toBe("succeeded");
    expect(provider.mode).toBe("test");
  });

  it("models declined and expired outcomes without accepting invalid transitions", () => {
    expect(canTransitionPayment("pending", "failed")).toBe(true);
    expect(canTransitionPayment("awaiting_customer_validation", "expired")).toBe(true);
    expect(canTransitionPayment("succeeded", "failed")).toBe(false);
  });

  it("supports delayed confirmation", () => {
    expect(canTransitionPayment("pending", "processing")).toBe(true);
    expect(canTransitionPayment("processing", "succeeded")).toBe(true);
  });

  it("deduplicates a double payment using the idempotency key", async () => {
    const provider = new TestPaymentProvider();
    const first = await provider.createPayment(payment);
    const second = await provider.createPayment(payment);
    expect(second).toBe(first);
  });

  it("rejects a webhook when no contractual verifier exists", async () => {
    const provider = new OrangeMoneyPaymentProvider(credentials, null);
    await expect(provider.processWebhook({ body: "{}", headers: new Headers(), receivedAt: new Date() })).rejects.toBeInstanceOf(PaymentProviderUnavailableError);
  });

  it("rejects an invalid webhook signature", async () => {
    const provider = new OrangeMoneyPaymentProvider(credentials, { ...contract, verifyWebhook: async () => false });
    await expect(provider.processWebhook({ body: "{}", headers: new Headers(), receivedAt: new Date() })).rejects.toThrow("non authentifiée");
  });

  it("rejects replayed stale webhooks", () => {
    expect(() => assertFreshWebhook(new Date("2026-07-22T00:00:00Z"), new Date("2026-07-22T00:06:00Z"))).toThrow("expirée");
  });

  it("removes OTP, tokens, signatures and phone numbers from event payloads", () => {
    expect(sanitizePaymentPayload({ amount: 100, otp: "123456", phoneNumber: "+22177", signature: "abc", token: "secret" })).toEqual({ amount: 100 });
  });

  it("requires a strong idempotency key", () => {
    expect(() => requireIdempotencyKey(new Request("https://app.test/api", { headers: { "idempotency-key": "short" } }))).toThrow("idempotence");
  });

  it("rejects a currency outside the signed country contract", async () => {
    const provider = new OrangeMoneyPaymentProvider(credentials, contract);
    await expect(provider.createPayment({ ...payment, currency: "EUR" })).rejects.toThrow("Devise non autorisée");
  });

  it("validates partial and full refunds against the server amount", () => {
    expect(validateRefund({ amount: 2_500, alreadyRefunded: 0, paymentAmount: 12_500, paymentStatus: "succeeded" })).toBe("partially_refunded");
    expect(() => validateRefund({ amount: 10_001, alreadyRefunded: 2_500, paymentAmount: 12_500, paymentStatus: "partially_refunded" })).toThrow("invalid_refund_amount");
  });

  it("rejects a user who does not own both the payment and shipment", () => {
    expect(() => assertPaymentOwnership("customer-1", "attacker", "customer-1")).toThrow("payment_ownership_mismatch");
  });

  it("surfaces provider outages and timeouts without manufacturing a transaction", async () => {
    const fetcher = vi.fn().mockRejectedValue(new Error("timeout"));
    const provider = new OrangeMoneyPaymentProvider(credentials, contract, fetcher as unknown as typeof fetch);
    await expect(provider.createPayment(payment)).rejects.toThrow("timeout");
  });

  it("reconciles amount and currency after a provider recovery", async () => {
    const provider = new TestPaymentProvider();
    await provider.createPayment(payment);
    const result = await provider.reconcileTransaction({ amount: payment.amount, currency: payment.currency, internalReference: payment.internalReference });
    expect(result).toEqual({ matched: true, status: "pending" });
  });

  it("requires independent dual approval for sensitive payouts", () => {
    expect(canReleasePayout({ amount: 500_000, approvedBy: "manager-1", initiatedBy: "agent-1", secondApprovedBy: null, threshold: 100_000 })).toBe(false);
    expect(canReleasePayout({ amount: 500_000, approvedBy: "manager-1", initiatedBy: "agent-1", secondApprovedBy: "manager-2", threshold: 100_000 })).toBe(true);
  });

  it("keeps production success dependent on a verified server event", () => {
    const migration = readFileSync(path.resolve(process.cwd(), "supabase/migrations/20260722020000_orange_money_payment_foundation.sql"), "utf8");
    const route = readFileSync(path.resolve(process.cwd(), "app/api/payments/webhooks/orange-money/route.ts"), "utf8");
    expect(route).toContain("event.verified");
    expect(migration).toContain("apply_verified_payment_event");
    expect(migration).toContain("on conflict (payment_id, provider_event_id) where provider_event_id is not null do nothing");
  });
});
