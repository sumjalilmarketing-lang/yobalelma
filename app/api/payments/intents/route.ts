import { fail, ok, parseJsonRequest } from "@/lib/api/responses";
import { createPaymentProvider } from "@/lib/payments/providers";
import { tryCreateSupabaseServerClient } from "@/lib/supabase/server";
import { paymentIntentSchema } from "@/lib/validation/operations";

export async function POST(request: Request) {
  const parsed = await parseJsonRequest(request, paymentIntentSchema);

  if (!parsed.ok) {
    return parsed.response;
  }

  const supabase = await tryCreateSupabaseServerClient();

  if (!supabase) {
    return fail("Le service Yobalelma n'est pas encore disponible.", 503);
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return fail("Connecte-toi pour creer un paiement.", 401);
  }

  if (process.env.NODE_ENV === "production") {
    return fail(
      "Le paiement en ligne n’est pas encore disponible. Aucune somme n’a été débitée.",
      503,
    );
  }

  const { data: shipment, error: shipmentError } = await supabase
    .from("shipments")
    .select("estimated_price_cents, currency")
    .eq("id", parsed.data.shipmentId)
    .eq("sender_id", user.id)
    .maybeSingle();

  if (shipmentError || !shipment) {
    return fail("Cette expédition ne peut pas être réglée depuis ce compte.", 404);
  }

  try {
    const provider = createPaymentProvider(supabase);
    const paymentIntent = await provider.createIntent({
      amountCents: shipment.estimated_price_cents,
      currency: shipment.currency,
      shipmentId: parsed.data.shipmentId,
    });

    return ok("Demande de paiement préparée.", {
      paymentIntentId: paymentIntent.id,
    });
  } catch (error) {
    return fail(error instanceof Error ? error.message : "Paiement impossible.", 400);
  }
}
