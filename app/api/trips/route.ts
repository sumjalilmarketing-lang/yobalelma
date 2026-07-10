import { fail, ok, validationFail } from "@/lib/api/responses";
import { tryCreateSupabaseServerClient } from "@/lib/supabase/server";
import { tripSchema } from "@/lib/validation/trip";

export async function POST(request: Request) {
  const parsed = tripSchema.safeParse(await request.json());

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
    return fail("Connecte-toi pour publier un voyage.", 401);
  }

  const { error } = await supabase.from("trips").insert({
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
  });

  if (error) {
    return fail(error.message, 400);
  }

  return ok("Voyage publie. Tu peux maintenant recevoir des propositions de colis.");
}
