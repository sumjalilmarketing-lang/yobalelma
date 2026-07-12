import { fail, ok, parseJsonRequest } from "@/lib/api/responses";
import { tryCreateSupabaseServerClient } from "@/lib/supabase/server";
import { missionActionSchema } from "@/lib/validation/mission";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const parsed = await parseJsonRequest(request, missionActionSchema);

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
    return fail("Connecte-toi pour mettre a jour la mission.", 401);
  }

  if (parsed.data.action === "accept") {
    const { data, error } = await supabase.rpc("accept_local_delivery_mission", {
      p_mission_id: id,
    });

    if (error) {
      return fail(error.message, 400);
    }

    return ok("Mission acceptee.", { missionId: data });
  }

  const { data, error } = await supabase.rpc("progress_local_delivery_mission", {
    p_action: parsed.data.action,
    p_delivery_otp: parsed.data.deliveryOtp || undefined,
    p_mission_id: id,
    p_proof_path: parsed.data.proofPath || undefined,
  });

  if (error) {
    return fail(error.message, 400);
  }

  return ok("Mission mise a jour.", { missionId: data });
}
