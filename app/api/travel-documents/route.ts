import { fail, ok, validationFail } from "@/lib/api/responses";
import { tryCreateSupabaseServerClient } from "@/lib/supabase/server";
import { travelDocumentSchema } from "@/lib/validation/hub";

export async function POST(request: Request) {
  const parsed = travelDocumentSchema.safeParse(await request.json());

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
    return fail("Connecte-toi pour soumettre un document de voyage.", 401);
  }

  const { error } = await supabase.from("traveler_documents").insert({
    arrival_airport: parsed.data.arrivalAirport,
    arrival_date: parsed.data.arrivalDate,
    departure_airport: parsed.data.departureAirport,
    departure_date: parsed.data.departureDate,
    document_number: parsed.data.documentNumber,
    file_path: parsed.data.filePath,
    issuing_country: parsed.data.issuingCountry,
    status: "submitted",
    traveler_id: user.id,
    traveler_name: parsed.data.travelerName,
    trip_id: parsed.data.tripId,
  });

  if (error) {
    return fail(error.message, 400);
  }

  return ok("Document de voyage soumis.");
}
