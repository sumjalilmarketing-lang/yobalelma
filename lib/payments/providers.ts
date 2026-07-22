import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";

export const paymentStatuses = [
  "created", "pending", "awaiting_customer_validation", "processing", "succeeded",
  "failed", "expired", "cancelled", "refund_pending", "refunded",
  "partially_refunded", "payout_pending", "payout_succeeded", "payout_failed",
] as const;

export type PaymentStatus = (typeof paymentStatuses)[number];
export type PaymentProviderName = "test" | "orange_money" | "wave" | "card";
export type ProviderMode = "test" | "sandbox" | "production";

export type Money = { amount: number; currency: string };
export type PaymentContext = Money & {
  customerId: string;
  countryCode: string;
  customerPhone?: string;
  idempotencyKey: string;
  internalReference: string;
  shipmentId: string;
};
export type PaymentRecord = Omit<PaymentContext, "customerPhone"> & {
  provider: PaymentProviderName;
  providerTransactionId: string | null;
  status: PaymentStatus;
};
export type PaymentStatusRequest = {
  internalReference: string;
  providerTransactionId?: string | null;
};
export type RefundRequest = PaymentStatusRequest & Money & {
  idempotencyKey: string;
  reason: string;
};
export type RefundResult = { providerRefundId: string | null; status: PaymentStatus };
export type WebhookRequest = { body: string; headers: Headers; receivedAt: Date };
export type WebhookResult = {
  eventId: string;
  internalReference: string;
  occurredAt: Date;
  providerTransactionId: string | null;
  status: PaymentStatus;
  verified: boolean;
};
export type ReconciliationRequest = PaymentStatusRequest & Money;
export type ReconciliationResult = { matched: boolean; status: PaymentStatus; reason?: string };
export type PayoutRequest = Money & {
  beneficiaryId: string;
  beneficiaryType: string;
  idempotencyKey: string;
  internalReference: string;
  reason: string;
};
export type PayoutResult = { providerPayoutId: string | null; status: PaymentStatus };

export interface PaymentProvider {
  readonly mode: ProviderMode;
  readonly name: PaymentProviderName;
  cancelPayment(input: PaymentStatusRequest): Promise<PaymentRecord>;
  confirmPayment(input: PaymentStatusRequest): Promise<PaymentRecord>;
  createPayment(input: PaymentContext): Promise<PaymentRecord>;
  getPaymentStatus(input: PaymentStatusRequest): Promise<PaymentRecord>;
  getPayoutStatus(input: PaymentStatusRequest): Promise<PayoutResult>;
  initiatePayout(input: PayoutRequest): Promise<PayoutResult>;
  processWebhook(input: WebhookRequest): Promise<WebhookResult>;
  reconcileTransaction(input: ReconciliationRequest): Promise<ReconciliationResult>;
  refundPayment(input: RefundRequest): Promise<RefundResult>;
}

export class PaymentProviderUnavailableError extends Error {
  constructor(message = "Le service de paiement n’est pas encore activé.") {
    super(message);
    this.name = "PaymentProviderUnavailableError";
  }
}

export class UnsupportedPaymentOperationError extends Error {
  constructor(operation: string) {
    super(`L’opération ${operation} n’est pas disponible avec l’offre contractuelle active.`);
    this.name = "UnsupportedPaymentOperationError";
  }
}

/**
 * Adaptateur de test explicite. Il ne contacte aucun réseau financier et ne crée
 * jamais d’identifiant de transaction fournisseur.
 */
export class TestPaymentProvider implements PaymentProvider {
  readonly mode = "test" as const;
  readonly name = "test" as const;
  private readonly records = new Map<string, PaymentRecord>();

  async createPayment(input: PaymentContext) {
    const existing = this.records.get(input.idempotencyKey);
    if (existing) return existing;
    const record: PaymentRecord = { amount: input.amount, currency: input.currency, customerId: input.customerId, countryCode: input.countryCode, idempotencyKey: input.idempotencyKey, internalReference: input.internalReference, shipmentId: input.shipmentId, provider: this.name, providerTransactionId: null, status: "pending" };
    this.records.set(input.idempotencyKey, record);
    return record;
  }

  async getPaymentStatus(input: PaymentStatusRequest) { return this.requireRecord(input.internalReference); }
  async confirmPayment(input: PaymentStatusRequest) { return this.update(input.internalReference, "succeeded"); }
  async cancelPayment(input: PaymentStatusRequest) { return this.update(input.internalReference, "cancelled"); }
  async refundPayment(input: RefundRequest): Promise<RefundResult> {
    this.update(input.internalReference, "refunded");
    return { providerRefundId: null, status: "refunded" };
  }
  async processWebhook(): Promise<WebhookResult> { throw new UnsupportedPaymentOperationError("webhook de test"); }
  async reconcileTransaction(input: ReconciliationRequest): Promise<ReconciliationResult> {
    const record = this.requireRecord(input.internalReference);
    return { matched: record.amount === input.amount && record.currency === input.currency, status: record.status };
  }
  async initiatePayout(input: PayoutRequest): Promise<PayoutResult> { void input; throw new UnsupportedPaymentOperationError("reversement de test"); }
  async getPayoutStatus(input: PaymentStatusRequest): Promise<PayoutResult> { void input; throw new UnsupportedPaymentOperationError("suivi de reversement de test"); }

  private requireRecord(reference: string) {
    const record = [...this.records.values()].find((item) => item.internalReference === reference);
    if (!record) throw new PaymentProviderUnavailableError("Paiement de test introuvable.");
    return record;
  }
  private update(reference: string, status: PaymentStatus) {
    const record = this.requireRecord(reference);
    const updated = { ...record, status };
    this.records.set(record.idempotencyKey, updated);
    return updated;
  }
}

export type OrangeMoneyCredentials = {
  baseUrl: string;
  clientId: string;
  clientSecret: string;
  countryCode: string;
  currency: string;
  environment: "sandbox" | "production";
  merchantId: string;
  merchantKey: string;
  webhookSecret: string;
};

export type OrangeMoneyContractMapping = {
  authorize: (credentials: OrangeMoneyCredentials, fetcher: typeof fetch) => Promise<HeadersInit>;
  buildRequest: (input: { body?: unknown; credentials: OrangeMoneyCredentials; idempotencyKey?: string; method: "GET" | "POST"; path: string }) => { body?: BodyInit; headers?: HeadersInit; method: "GET" | "POST" };
  cancelPath?: string;
  confirmPath: string;
  createPath: string;
  parsePayment: (payload: unknown, input: PaymentContext | PaymentStatusRequest) => PaymentRecord;
  parseWebhook: (payload: unknown) => Omit<WebhookResult, "verified">;
  payoutCreatePath?: string;
  payoutStatusPath?: (transactionId: string) => string;
  refundPath?: string;
  statusPath: (transactionId: string) => string;
  verifyWebhook: (request: WebhookRequest, secret: string) => Promise<boolean>;
};

/** Adaptateur officiel prêt à recevoir le mapping remis par Orange, sans endpoint supposé. */
export class OrangeMoneyPaymentProvider implements PaymentProvider {
  readonly name = "orange_money" as const;
  readonly mode: ProviderMode;

  constructor(
    private readonly credentials: OrangeMoneyCredentials,
    private readonly contract: OrangeMoneyContractMapping | null,
    private readonly fetcher: typeof fetch = fetch,
  ) {
    this.mode = credentials.environment;
  }

  async createPayment(input: PaymentContext) {
    this.validateMoney(input);
    const mapping = this.requireContract();
    const payload = await this.request(mapping.createPath, "POST", input, input.idempotencyKey);
    return mapping.parsePayment(payload, input);
  }
  async getPaymentStatus(input: PaymentStatusRequest) {
    const transactionId = this.requireTransactionId(input);
    const mapping = this.requireContract();
    const payload = await this.request(mapping.statusPath(transactionId), "GET");
    return mapping.parsePayment(payload, input);
  }
  async confirmPayment(input: PaymentStatusRequest) {
    const mapping = this.requireContract();
    const payload = await this.request(mapping.confirmPath, "POST", input);
    return mapping.parsePayment(payload, input);
  }
  async cancelPayment(input: PaymentStatusRequest) {
    const mapping = this.requireContract();
    if (!mapping.cancelPath) throw new UnsupportedPaymentOperationError("annulation");
    const payload = await this.request(mapping.cancelPath, "POST", input);
    return mapping.parsePayment(payload, input);
  }
  async refundPayment(input: RefundRequest): Promise<RefundResult> {
    this.validateMoney(input);
    const mapping = this.requireContract();
    if (!mapping.refundPath) throw new UnsupportedPaymentOperationError("remboursement");
    const payload = await this.request(mapping.refundPath, "POST", input, input.idempotencyKey) as Record<string, unknown>;
    return { providerRefundId: typeof payload.providerRefundId === "string" ? payload.providerRefundId : null, status: "refund_pending" };
  }
  async processWebhook(input: WebhookRequest) {
    const mapping = this.requireContract();
    if (!(await mapping.verifyWebhook(input, this.credentials.webhookSecret))) {
      throw new PaymentProviderUnavailableError("Notification de paiement non authentifiée.");
    }
    const payload = JSON.parse(input.body) as unknown;
    return { ...mapping.parseWebhook(payload), verified: true };
  }
  async reconcileTransaction(input: ReconciliationRequest): Promise<ReconciliationResult> {
    this.validateMoney(input);
    const status = await this.getPaymentStatus(input);
    return { matched: status.amount === input.amount && status.currency === input.currency, status: status.status, reason: status.amount === input.amount ? undefined : "amount_mismatch" };
  }
  async initiatePayout(input: PayoutRequest): Promise<PayoutResult> {
    this.validateMoney(input);
    const mapping = this.requireContract();
    if (!mapping.payoutCreatePath) throw new UnsupportedPaymentOperationError("reversement");
    const payload = await this.request(mapping.payoutCreatePath, "POST", input, input.idempotencyKey) as Record<string, unknown>;
    return { providerPayoutId: typeof payload.providerPayoutId === "string" ? payload.providerPayoutId : null, status: "payout_pending" };
  }
  async getPayoutStatus(input: PaymentStatusRequest): Promise<PayoutResult> {
    const mapping = this.requireContract();
    if (!mapping.payoutStatusPath) throw new UnsupportedPaymentOperationError("suivi de reversement");
    const payload = await this.request(mapping.payoutStatusPath(this.requireTransactionId(input)), "GET") as Record<string, unknown>;
    return { providerPayoutId: input.providerTransactionId ?? null, status: payload.status === "succeeded" ? "payout_succeeded" : "payout_pending" };
  }

  private requireContract() {
    if (!this.contract) throw new PaymentProviderUnavailableError("La documentation contractuelle Orange Money est requise avant activation.");
    return this.contract;
  }
  private requireTransactionId(input: PaymentStatusRequest) {
    if (!input.providerTransactionId) throw new PaymentProviderUnavailableError("Identifiant fournisseur absent.");
    return encodeURIComponent(input.providerTransactionId);
  }
  private validateMoney(input: Money) {
    if (!Number.isSafeInteger(input.amount) || input.amount <= 0) throw new PaymentProviderUnavailableError("Montant invalide.");
    if (input.currency !== this.credentials.currency) throw new PaymentProviderUnavailableError("Devise non autorisée pour ce contrat.");
  }
  private async request(path: string, method: "GET" | "POST", body?: unknown, idempotencyKey?: string) {
    const mapping = this.requireContract();
    const authorization = await mapping.authorize(this.credentials, this.fetcher);
    const request = mapping.buildRequest({ body, credentials: this.credentials, idempotencyKey, method, path });
    const headers = new Headers(authorization);
    new Headers(request.headers).forEach((value, key) => headers.set(key, value));
    const response = await this.fetcher(new URL(path, this.credentials.baseUrl), { ...request, headers });
    if (!response.ok) throw new PaymentProviderUnavailableError();
    return response.json() as Promise<unknown>;
  }
}

export function orangeMoneyCredentialsFromEnv(env: NodeJS.ProcessEnv = process.env): OrangeMoneyCredentials | null {
  const keys = ["ORANGE_MONEY_BASE_URL", "ORANGE_MONEY_CLIENT_ID", "ORANGE_MONEY_CLIENT_SECRET", "ORANGE_MONEY_MERCHANT_KEY", "ORANGE_MONEY_MERCHANT_ID", "ORANGE_MONEY_WEBHOOK_SECRET", "ORANGE_MONEY_COUNTRY_CODE", "ORANGE_MONEY_CURRENCY"] as const;
  if (!keys.every((key) => env[key]?.trim())) return null;
  if (env.ORANGE_MONEY_ENV !== "sandbox" && env.ORANGE_MONEY_ENV !== "production") return null;
  return { baseUrl: env.ORANGE_MONEY_BASE_URL!, clientId: env.ORANGE_MONEY_CLIENT_ID!, clientSecret: env.ORANGE_MONEY_CLIENT_SECRET!, countryCode: env.ORANGE_MONEY_COUNTRY_CODE!, currency: env.ORANGE_MONEY_CURRENCY!, environment: env.ORANGE_MONEY_ENV, merchantId: env.ORANGE_MONEY_MERCHANT_ID!, merchantKey: env.ORANGE_MONEY_MERCHANT_KEY!, webhookSecret: env.ORANGE_MONEY_WEBHOOK_SECRET! };
}

export function createPaymentProvider(options: { contract?: OrangeMoneyContractMapping | null; env?: NodeJS.ProcessEnv } = {}): PaymentProvider {
  const env = options.env ?? process.env;
  if (env.PAYMENT_PROVIDER_MODE === "test" && env.NODE_ENV !== "production") return new TestPaymentProvider();
  const credentials = orangeMoneyCredentialsFromEnv(env);
  if (!credentials) throw new PaymentProviderUnavailableError("Les accès officiels Orange Money sont requis avant activation.");
  return new OrangeMoneyPaymentProvider(credentials, options.contract ?? null);
}

/** Compatibilité temporaire : l’ancien RPC reste explicitement réservé aux environnements non productifs. */
export class SupabaseSandboxPaymentProvider {
  readonly name = "test" as const;
  constructor(private readonly supabase: SupabaseClient<Database>) {}
  async createIntent(input: { amountCents: number; currency: string; shipmentId: string }) {
    if (process.env.NODE_ENV === "production") throw new PaymentProviderUnavailableError();
    const { data, error } = await this.supabase.rpc("create_sandbox_payment_intent", { p_amount_cents: input.amountCents, p_currency: input.currency, p_shipment_id: input.shipmentId });
    if (error) throw new Error(error.message);
    return { id: data, mode: "sandbox" as const, provider: "test" as const };
  }
}
