import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";

export type PaymentProviderName = "sandbox" | "manual" | "mobile_money" | "card";
export type PayoutProviderName = "sandbox" | "manual" | "mobile_money";

export type CreatePaymentIntentInput = {
  amountCents: number;
  currency: string;
  shipmentId: string;
};

export type CreatePaymentIntentResult = {
  id: string;
  mode: "sandbox" | "manual";
  provider: PaymentProviderName;
};

export interface PaymentProvider {
  readonly name: PaymentProviderName;
  createIntent(input: CreatePaymentIntentInput): Promise<CreatePaymentIntentResult>;
}

export type CreatePayoutInput = {
  amountCents: number;
  beneficiaryId: string;
  currency: string;
  shipmentId?: string | null;
};

export type CreatePayoutResult = {
  id: string;
  mode: "sandbox" | "manual";
  provider: PayoutProviderName;
};

export interface PayoutProvider {
  readonly name: PayoutProviderName;
  createPayout(input: CreatePayoutInput): Promise<CreatePayoutResult>;
}

export class SupabaseSandboxPaymentProvider implements PaymentProvider {
  readonly name = "sandbox" as const;

  constructor(private readonly supabase: SupabaseClient<Database>) {}

  async createIntent(input: CreatePaymentIntentInput): Promise<CreatePaymentIntentResult> {
    const { data, error } = await this.supabase.rpc("create_sandbox_payment_intent", {
      p_amount_cents: input.amountCents,
      p_currency: input.currency,
      p_shipment_id: input.shipmentId,
    });

    if (error) {
      throw new Error(error.message);
    }

    return {
      id: data,
      mode: "sandbox",
      provider: this.name,
    };
  }
}

export class ManualPaymentProvider implements PaymentProvider {
  readonly name = "manual" as const;

  async createIntent(input: CreatePaymentIntentInput): Promise<CreatePaymentIntentResult> {
    return {
      id: `manual_${input.shipmentId}_${input.amountCents}_${input.currency}`.toLowerCase(),
      mode: "manual",
      provider: this.name,
    };
  }
}

export class ManualPayoutProvider implements PayoutProvider {
  readonly name = "manual" as const;

  async createPayout(input: CreatePayoutInput): Promise<CreatePayoutResult> {
    return {
      id: `manual_payout_${input.beneficiaryId}_${input.amountCents}_${input.currency}`.toLowerCase(),
      mode: "manual",
      provider: this.name,
    };
  }
}

export function createPaymentProvider(
  supabase: SupabaseClient<Database>,
  name: PaymentProviderName = "sandbox",
): PaymentProvider {
  if (name === "manual") {
    return new ManualPaymentProvider();
  }

  if (name === "sandbox") {
    return new SupabaseSandboxPaymentProvider(supabase);
  }

  throw new Error(`Payment provider ${name} is not configured yet.`);
}

export function createPayoutProvider(name: PayoutProviderName = "manual"): PayoutProvider {
  if (name === "manual" || name === "sandbox") {
    return new ManualPayoutProvider();
  }

  throw new Error(`Payout provider ${name} is not configured yet.`);
}

