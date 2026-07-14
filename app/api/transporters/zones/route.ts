import { fail, ok, parseJsonRequest } from "@/lib/api/responses";
import { tryCreateSupabaseServerClient } from "@/lib/supabase/server";
import { transporterZoneSchema } from "@/lib/validation/transporter";

export async function POST(request: Request) {
  const parsed = await parseJsonRequest(request, transporterZoneSchema);

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
    return fail("Connecte-toi pour ajouter une zone.", 401);
  }

  const { error } = await supabase.from("transporter_zones").insert({
    active: true,
    city: parsed.data.city,
    country: parsed.data.country,
    profile_id: user.id,
    radius_km: parsed.data.radiusKm,
  });

  if (error) {
    return fail(error.message, 400);
  }

  return ok("Zone de livraison ajoutee.");
}
