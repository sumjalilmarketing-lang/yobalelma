import { fail, ok, parseJsonRequest } from "@/lib/api/responses";
import { tryCreateSupabaseServerClient } from "@/lib/supabase/server";
import { hubBatchSchema } from "@/lib/validation/hub";

export async function POST(request: Request) {
  const parsed = await parseJsonRequest(request, hubBatchSchema);

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
    return fail("Connecte-toi pour creer un batch hub.", 401);
  }

  const { error } = await supabase.from("hub_batches").insert({
    capacity_kg: parsed.data.capacityKg,
    code: parsed.data.code,
    created_by: user.id,
    departure_date: parsed.data.departureDate,
    destination_hub: parsed.data.destinationHub,
    flight_number: parsed.data.flightNumber || null,
    origin_hub: parsed.data.originHub,
    status: "open",
    traveler_id: parsed.data.travelerId || null,
    trip_id: parsed.data.tripId || null,
  });

  if (error) {
    return fail(error.message, 400);
  }

  return ok("Batch hub cree.");
}
