import { fail, ok, parseJsonRequest } from "@/lib/api/responses";
import { callSupabaseRpc } from "@/lib/supabase/rpc";
import { tryCreateSupabaseServerClient } from "@/lib/supabase/server";
import { hubIncidentSchema } from "@/lib/validation/hub";

function nullableText(value?: string | null) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

export async function POST(request: Request) {
  const parsed = await parseJsonRequest(request, hubIncidentSchema);

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
    return fail("Connecte-toi pour declarer une anomalie hub.", 401);
  }

  const { data, error } = await callSupabaseRpc<string>(
    supabase,
    "create_hub_incident",
    {
      p_batch_id: nullableText(parsed.data.batchId),
      p_blocks_payout: parsed.data.blocksPayout,
      p_description: nullableText(parsed.data.description),
      p_hub_id: nullableText(parsed.data.hubId),
      p_incident_type: parsed.data.incidentType,
      p_priority: parsed.data.priority,
      p_shipment_id: nullableText(parsed.data.shipmentId),
      p_title: parsed.data.title,
    },
  );

  if (error) {
    return fail(error.message, 400);
  }

  return ok("Anomalie hub creee.", { incidentId: data ?? undefined });
}
