import { fail, ok, parseJsonRequest } from "@/lib/api/responses";
import { tryCreateSupabaseServerClient } from "@/lib/supabase/server";
import { dispatchMissionSchema } from "@/lib/validation/mission";

export async function POST(request: Request) {
  const parsed = await parseJsonRequest(request, dispatchMissionSchema);

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
    return fail("Connecte-toi pour dispatcher une expedition.", 401);
  }

  const { data, error } = await supabase.rpc("dispatch_local_delivery_missions", {
    p_candidate_limit: parsed.data.candidateLimit,
    p_shipment_id: parsed.data.shipmentId,
  });

  if (error) {
    return fail(error.message, 400);
  }

  return ok("Dispatch local execute.", { missions: data ?? [] });
}
