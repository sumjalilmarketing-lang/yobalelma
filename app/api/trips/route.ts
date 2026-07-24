import { fail, ok, parseJsonRequest } from "@/lib/api/responses";
import { tryCreateSupabaseServerClient } from "@/lib/supabase/server";
import { tripSchema } from "@/lib/validation/trip";

export async function GET() {
  const supabase = await tryCreateSupabaseServerClient();

  if (!supabase) {
    return fail("Le service Yobalelma n'est pas encore disponible.", 503);
  }

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return fail("Connecte-toi pour consulter tes voyages.", 401);
  }

  const { data, error } = await supabase
    .from("trips")
    .select("id, origin_city, destination_city, departure_date")
    .eq("traveler_id", user.id)
    .order("departure_date", { ascending: true })
    .limit(100);

  if (error) {
    return fail(error.message, 400);
  }

  return ok("Voyages disponibles.", {
    trips: (data ?? []).map((trip) => ({
      id: trip.id,
      label: `${trip.origin_city} → ${trip.destination_city} · ${trip.departure_date}`,
    })),
  });
}

export async function POST(request: Request) {
  const parsed = await parseJsonRequest(request, tripSchema);

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
    return fail("Connecte-toi pour publier un voyage.", 401);
  }

  const { data, error } = await supabase
    .from("trips")
    .insert({
      traveler_id: user.id,
      origin_city: parsed.data.originCity,
      origin_country: parsed.data.originCountry,
      destination_city: parsed.data.destinationCity,
      destination_country: parsed.data.destinationCountry,
      departure_date: parsed.data.departureDate,
      arrival_date: parsed.data.arrivalDate,
      available_weight_kg: parsed.data.availableWeightKg,
      notes: parsed.data.notes || null,
      status: "planned",
    })
    .select("id")
    .single();

  if (error) {
    return fail(error.message, 400);
  }

  return ok("Voyage publie. Tu peux maintenant recevoir des propositions de colis.", {
    tripId: data.id,
  });
}
