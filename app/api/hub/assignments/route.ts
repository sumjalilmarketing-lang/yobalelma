import { fail, ok, validationFail } from "@/lib/api/responses";
import { tryCreateSupabaseServerClient } from "@/lib/supabase/server";
import { hubBatchAssignmentSchema } from "@/lib/validation/hub";

export async function POST(request: Request) {
  const parsed = hubBatchAssignmentSchema.safeParse(await request.json());

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
    return fail("Connecte-toi pour reserver une capacite hub.", 401);
  }

  const { data, error } = await supabase.rpc("reserve_batch_capacity", {
    p_batch_id: parsed.data.batchId,
    p_reserved_weight_kg: parsed.data.reservedWeightKg,
    p_shipment_id: parsed.data.shipmentId,
  });

  if (error) {
    return fail(error.message, 400);
  }

  return ok("Expedition ajoutee au batch.", { reservationId: data });
}
