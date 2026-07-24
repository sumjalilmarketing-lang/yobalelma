import type { SupabaseClient } from "@supabase/supabase-js";
import { fail, ok, parseJsonRequest } from "@/lib/api/responses";
import { createPaymentProvider, PaymentProviderUnavailableError } from "@/lib/payments/providers";
import { assertPaymentRateLimit, assertSameOrigin, internalPaymentReference, requireIdempotencyKey } from "@/lib/payments/security";
import { tryCreateSupabaseServerClient } from "@/lib/supabase/server";
import { tryCreateSupabaseServiceClient } from "@/lib/supabase/service";
import { paymentIntentSchema } from "@/lib/validation/operations";

export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    assertPaymentRateLimit(request);
    const idempotencyKey = requireIdempotencyKey(request);
    const parsed = await parseJsonRequest(request, paymentIntentSchema);
    if (!parsed.ok) return parsed.response;

    const supabase = await tryCreateSupabaseServerClient();
    const service = tryCreateSupabaseServiceClient();
    if (!supabase || !service) return fail("Le service de paiement est temporairement indisponible.", 503);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return fail("Connecte-toi pour préparer ce paiement.", 401);

    const { data: shipment, error } = await supabase.from("shipments")
      .select("id, sender_id, estimated_price_cents, currency, origin_country")
      .eq("id", parsed.data.shipmentId).eq("sender_id", user.id).maybeSingle();
    if (error || !shipment) return fail("Cette expédition ne peut pas être réglée depuis ce compte.", 404);
    if (!Number.isSafeInteger(shipment.estimated_price_cents) || shipment.estimated_price_cents <= 0) return fail("Le montant de cette expédition doit être vérifié.", 409);

    const db = service as SupabaseClient;
    const { data: existing } = await db.from("payments").select("id, internal_reference, status, provider")
      .eq("provider", process.env.PAYMENT_PROVIDER_MODE === "test" ? "test" : "orange_money")
      .eq("idempotency_key", idempotencyKey).maybeSingle();
    if (existing) return ok("Demande déjà prise en compte.", { paymentId: existing.id, reference: existing.internal_reference, status: existing.status, provider: existing.provider });

    const provider = createPaymentProvider();
    const reference = internalPaymentReference();
    const context = { amount: shipment.estimated_price_cents, currency: shipment.currency, customerId: user.id, customerPhone: parsed.data.phoneNumber, countryCode: shipment.origin_country, idempotencyKey, internalReference: reference, shipmentId: shipment.id };
    const { data: payment, error: insertError } = await db.from("payments").insert({ amount: context.amount, country_code: context.countryCode, currency: context.currency, customer_id: user.id, idempotency_key: idempotencyKey, internal_reference: reference, metadata: { source: "user_app" }, payment_type: "shipment", provider: provider.name, shipment_id: shipment.id, status: "created" }).select("id").single();
    if (insertError || !payment) return fail("Le paiement n’a pas pu être préparé.", 409);

    try {
      const result = await provider.createPayment(context);
      await db.from("payments").update({ initiated_at: new Date().toISOString(), provider_transaction_id: result.providerTransactionId, status: result.status }).eq("id", payment.id);
      return ok(provider.mode === "test" ? "Paiement de test préparé. Aucun débit réel ne sera effectué." : "Paiement préparé. Confirmez-le depuis votre téléphone.", { mode: provider.mode, paymentId: payment.id, reference, status: result.status });
    } catch (providerError) {
      await db.from("payments").update({ failed_at: new Date().toISOString(), failure_code: "provider_unavailable", failure_message: "provider_not_activated", status: "failed" }).eq("id", payment.id);
      throw providerError;
    }
  } catch (error) {
    const unavailable = error instanceof PaymentProviderUnavailableError;
    return fail(error instanceof Error ? error.message : "Paiement impossible.", unavailable ? 503 : 400);
  }
}
