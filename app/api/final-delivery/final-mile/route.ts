import { fail, ok, parseJsonRequest } from "@/lib/api/responses";
import { callSupabaseRpc } from "@/lib/supabase/rpc";
import { tryCreateSupabaseServerClient } from "@/lib/supabase/server";
import { finalMileMissionSchema } from "@/lib/validation/final-delivery";

type FinalMileMissionResult = {
  mission_id: string;
  transporter_id: string;
  status: string;
};

export async function POST(request: Request) {
  const parsed = await parseJsonRequest(request, finalMileMissionSchema);

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
    return fail("Connecte-toi pour creer une mission finale.", 401);
  }

  const { data, error } = await callSupabaseRpc<FinalMileMissionResult[]>(
    supabase,
    "create_final_mile_delivery_mission",
    {
      p_note: parsed.data.note || undefined,
      p_shipment_id: parsed.data.shipmentId,
      p_transporter_id: parsed.data.transporterId || undefined,
    },
  );

  if (error) {
    return fail(error.message, 400);
  }

  return ok("Mission finale creee.", { mission: data?.[0] ?? null });
}
