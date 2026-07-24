import type { SupabaseClient } from "@supabase/supabase-js";
import { fail, ok } from "@/lib/api/responses";
import { createPaymentProvider, PaymentProviderUnavailableError } from "@/lib/payments/providers";
import { assertPaymentRateLimit } from "@/lib/payments/security";
import { tryCreateSupabaseServerClient } from "@/lib/supabase/server";
import { tryCreateSupabaseServiceClient } from "@/lib/supabase/service";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    assertPaymentRateLimit(request, 60);
    const { id } = await params;
    const supabase = await tryCreateSupabaseServerClient();
    const service = tryCreateSupabaseServiceClient();
    if (!supabase || !service) return fail("Le suivi du paiement est indisponible.", 503);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return fail("Connecte-toi pour consulter ce paiement.", 401);
    const db = service as SupabaseClient;
    const { data: payment } = await db.from("payments").select("id, customer_id, internal_reference, provider_transaction_id, provider, status, amount, currency, shipment_id, updated_at").eq("id", id).eq("customer_id", user.id).maybeSingle();
    if (!payment) return fail("Paiement introuvable.", 404);

    if (payment.provider === "test") return ok("Statut de test.", { mode: "test", paymentId: payment.id, status: payment.status, updatedAt: payment.updated_at });
    const provider = createPaymentProvider();
    const providerState = await provider.getPaymentStatus({ internalReference: payment.internal_reference, providerTransactionId: payment.provider_transaction_id });
    await db.from("payments").update({ last_provider_check_at: new Date().toISOString(), status: providerState.status }).eq("id", payment.id);
    return ok("Statut confirmé par le fournisseur.", { mode: provider.mode, paymentId: payment.id, status: providerState.status });
  } catch (error) {
    return fail(error instanceof Error ? error.message : "Statut indisponible.", error instanceof PaymentProviderUnavailableError ? 503 : 400);
  }
}
