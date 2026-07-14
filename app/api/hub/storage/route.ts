import { fail, ok, parseJsonRequest } from "@/lib/api/responses";
import { callSupabaseRpc } from "@/lib/supabase/rpc";
import { tryCreateSupabaseServerClient } from "@/lib/supabase/server";
import { hubStorageMoveSchema } from "@/lib/validation/hub";

function nullableText(value?: string | null) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

export async function POST(request: Request) {
  const parsed = await parseJsonRequest(request, hubStorageMoveSchema);

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
    return fail("Connecte-toi pour deplacer un colis au hub.", 401);
  }

  const { data, error } = await callSupabaseRpc<string>(
    supabase,
    "move_hub_inventory",
    {
      p_hub_id: parsed.data.hubId,
      p_measured_weight_kg: parsed.data.measuredWeightKg ?? null,
      p_note: nullableText(parsed.data.note),
      p_shipment_id: parsed.data.shipmentId,
      p_status: parsed.data.status,
      p_to_location_id: nullableText(parsed.data.toLocationId),
    },
  );

  if (error) {
    return fail(error.message, 400);
  }

  return ok("Mouvement inventaire hub enregistre.", { inventoryId: data ?? undefined });
}
