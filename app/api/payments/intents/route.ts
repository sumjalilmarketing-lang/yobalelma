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

  try {
    const provider = createPaymentProvider(supabase);
    const paymentIntent = await provider.createIntent({
      amountCents: parsed.data.amountCents,
      currency: parsed.data.currency,
      shipmentId: parsed.data.shipmentId,
    });

    return ok("Intention de paiement sandbox creee.", {
      mode: paymentIntent.mode,
      paymentIntentId: paymentIntent.id,
      provider: paymentIntent.provider,
    });
  } catch (error) {
    return fail(error instanceof Error ? error.message : "Paiement impossible.", 400);
  }
}
