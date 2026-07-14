import { fail, ok, parseJsonRequest } from "@/lib/api/responses";
import { tryCreateSupabaseServerClient } from "@/lib/supabase/server";
import { parcelRequestSchema } from "@/lib/validation/parcel-request";

export async function POST(request: Request) {
  const parsed = await parseJsonRequest(request, parcelRequestSchema);

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
    return fail("Connecte-toi pour publier une demande d'envoi.", 401);
  }

  const { error } = await supabase.from("parcel_requests").insert({
    sender_id: user.id,
    origin_city: parsed.data.originCity,
    origin_country: parsed.data.originCountry,
    destination_city: parsed.data.destinationCity,
    destination_country: parsed.data.destinationCountry,
    package_type: parsed.data.packageType,
    weight_kg: parsed.data.weightKg,
    deadline: parsed.data.deadline,
    description: parsed.data.description,
    declared_value_cents: parsed.data.declaredValueCents,
    status: "open",
  });

  if (error) {
    return fail(error.message, 400);
  }

  return ok("Demande d'envoi publiee. Les voyageurs compatibles pourront proposer un transport.");
}
