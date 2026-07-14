import { fail, ok, parseJsonRequest } from "@/lib/api/responses";
import { callSupabaseRpc } from "@/lib/supabase/rpc";
import { tryCreateSupabaseServerClient } from "@/lib/supabase/server";
import { finalDeliveryChoiceSchema } from "@/lib/validation/final-delivery";

export async function POST(request: Request) {
  const parsed = await parseJsonRequest(request, finalDeliveryChoiceSchema);

  if (!parsed.ok) {
    return parsed.response;
  }

  const supabase = await tryCreateSupabaseServerClient();

  if (!supabase) {
    return fail("Supabase n'est pas encore configure dans l'environnement local.", 503);
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return fail("Connecte-toi pour choisir le mode de remise.", 401);
  }

  const { data, error } = await callSupabaseRpc<string>(
    supabase,
    "set_final_delivery_choice",
    {
      p_delivery_mode: parsed.data.deliveryMode,
      p_reason: parsed.data.reason || undefined,
      p_shipment_id: parsed.data.shipmentId,
    },
  );

  if (error) {
    return fail(error.message, 400);
  }

  return ok("Mode de remise mis a jour.", { orderId: data });
}
