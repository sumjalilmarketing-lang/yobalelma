import { fail, ok, parseJsonRequest } from "@/lib/api/responses";
import { callSupabaseRpc } from "@/lib/supabase/rpc";
import { tryCreateSupabaseServerClient } from "@/lib/supabase/server";
import { deliveryOverrideSchema } from "@/lib/validation/final-delivery";

export async function POST(request: Request) {
  const parsed = await parseJsonRequest(request, deliveryOverrideSchema);

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
    return fail("Connecte-toi pour executer un override.", 401);
  }

  const { data, error } = await callSupabaseRpc<string>(
    supabase,
    "admin_manual_delivery_override",
    {
      p_comment: parsed.data.comment,
      p_force_delivered: parsed.data.forceDelivered,
      p_new_status: parsed.data.newStatus,
      p_reason: parsed.data.reason,
      p_shipment_id: parsed.data.shipmentId,
    },
  );

  if (error) {
    return fail(error.message, 400);
  }

  return ok("Override de livraison audite.", { correctionId: data });
}
