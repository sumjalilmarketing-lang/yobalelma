import { fail, ok, parseJsonRequest } from "@/lib/api/responses";
import { tryCreateSupabaseServerClient } from "@/lib/supabase/server";
import { transporterProfileSchema } from "@/lib/validation/transporter";

export async function PUT(request: Request) {
  const parsed = await parseJsonRequest(request, transporterProfileSchema);

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
    return fail("Connecte-toi pour enregistrer ton profil transporteur.", 401);
  }

  const { error } = await supabase.from("transporter_profiles").upsert({
    base_city: parsed.data.baseCity,
    base_country: parsed.data.baseCountry,
    bio: parsed.data.bio,
    business_name: parsed.data.businessName,
    max_weight_kg: parsed.data.maxWeightKg,
    profile_id: user.id,
    status: "active",
  });

  if (error) {
    return fail(error.message, 400);
  }

  return ok("Profil transporteur enregistre.");
}
