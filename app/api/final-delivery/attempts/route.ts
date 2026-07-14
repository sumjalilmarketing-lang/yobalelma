import { fail, ok, parseJsonRequest } from "@/lib/api/responses";
import { callSupabaseRpc } from "@/lib/supabase/rpc";
import { tryCreateSupabaseServerClient } from "@/lib/supabase/server";
import { finalDeliveryAttemptSchema } from "@/lib/validation/final-delivery";

export async function POST(request: Request) {
  const parsed = await parseJsonRequest(request, finalDeliveryAttemptSchema);

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
    return fail("Connecte-toi pour journaliser une tentative.", 401);
  }

  const { data, error } = await callSupabaseRpc<string>(
    supabase,
    "record_final_delivery_attempt",
    {
      p_note: parsed.data.note,
      p_rescheduled_for: parsed.data.rescheduledFor || undefined,
      p_shipment_id: parsed.data.shipmentId,
      p_status: parsed.data.status,
    },
  );

  if (error) {
    return fail(error.message, 400);
  }

  return ok("Tentative de livraison journalisee.", { eventId: data });
}
