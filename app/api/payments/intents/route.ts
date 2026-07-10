import { fail, ok, validationFail } from "@/lib/api/responses";
import { tryCreateSupabaseServerClient } from "@/lib/supabase/server";
import { paymentIntentSchema } from "@/lib/validation/operations";

export async function POST(request: Request) {
  const parsed = paymentIntentSchema.safeParse(await request.json());

  if (!parsed.success) {
    return validationFail(parsed.error);
  }

  const supabase = await tryCreateSupabaseServerClient();

  if (!supabase) {
    return fail("Supabase n'est pas encore configure dans l'environnement local.", 503);
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return fail("Connecte-toi pour creer un paiement.", 401);
  }

  const { data, error } = await supabase.rpc("create_sandbox_payment_intent", {
    p_amount_cents: parsed.data.amountCents,
    p_currency: parsed.data.currency,
    p_shipment_id: parsed.data.shipmentId,
  });

  if (error) {
    return fail(error.message, 400);
  }

  return ok("Intention de paiement sandbox creee.", { paymentIntentId: data });
}
