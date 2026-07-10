import { fail, ok, validationFail } from "@/lib/api/responses";
import { tryCreateSupabaseServerClient } from "@/lib/supabase/server";
import { transporterZoneSchema } from "@/lib/validation/transporter";

export async function POST(request: Request) {
  const parsed = transporterZoneSchema.safeParse(await request.json());

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
