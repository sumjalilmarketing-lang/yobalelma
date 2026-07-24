import { fail, ok, parseJsonRequest } from "@/lib/api/responses";
import { tryCreateSupabaseServerClient } from "@/lib/supabase/server";
import { travelDocumentSchema } from "@/lib/validation/hub";
import type { Json } from "@/types/database.types";

export async function POST(request: Request) {
  const parsed = await parseJsonRequest(request, travelDocumentSchema);

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
    return fail("Connecte-toi pour soumettre un document de voyage.", 401);
  }

  const expectedPathPrefix = `${user.id}/`;
  if (!parsed.data.filePath.startsWith(expectedPathPrefix)) {
    return fail("Ce document ne peut pas être rattaché à ton dossier.", 403);
  }

  const { data: ownedTrip, error: tripError } = await supabase
    .from("trips")
    .select("id")
    .eq("id", parsed.data.tripId)
    .eq("traveler_id", user.id)
    .maybeSingle();

  if (tripError || !ownedTrip) {
    return fail("Le voyage sélectionné est introuvable.", 404);
  }

  const { data, error } = await supabase
    .from("traveler_documents")
    .insert({
      arrival_airport: parsed.data.arrivalAirport,
      arrival_date: parsed.data.arrivalDate,
      departure_airport: parsed.data.departureAirport,
      departure_date: parsed.data.departureDate,
      document_number: parsed.data.documentNumber,
      file_path: parsed.data.filePath,
      confidence_score: parsed.data.confidenceScore ?? null,
      extracted_payload: (parsed.data.extractionPayload ?? {}) as Json,
      issuing_country: parsed.data.issuingCountry,
      manual_review_required: true,
      status: "submitted",
      traveler_id: user.id,
      traveler_name: parsed.data.travelerName,
      trip_id: parsed.data.tripId,
    })
    .select("id")
    .single();

  if (error) {
    return fail(error.message, 400);
  }

  return ok("Document de voyage soumis.", { documentId: data.id });
}
