import { fail, ok, parseJsonRequest } from "@/lib/api/responses";
import { callSupabaseRpc } from "@/lib/supabase/rpc";
import { tryCreateSupabaseServerClient } from "@/lib/supabase/server";
import { destinationBatchReceptionSchema } from "@/lib/validation/final-delivery";

type DestinationReceptionResult = {
  order_id: string;
  shipment_id: string;
  status: string;
};

export async function POST(request: Request) {
  const parsed = await parseJsonRequest(request, destinationBatchReceptionSchema);

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
    return fail("Connecte-toi pour receptionner un lot destination.", 401);
  }

  const { data, error } = await callSupabaseRpc<DestinationReceptionResult[]>(
    supabase,
    "confirm_destination_batch_reception",
    {
      p_batch_id: parsed.data.batchId,
      p_default_delivery_mode: parsed.data.defaultDeliveryMode,
      p_note: parsed.data.note || undefined,
      p_relay_point_id: parsed.data.relayPointId || undefined,
    },
  );

  if (error) {
    return fail(error.message, 400);
  }

  return ok("Lot destination receptionne.", { orders: data ?? [] });
}
