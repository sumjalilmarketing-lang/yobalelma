import { fail, ok, parseJsonRequest } from "@/lib/api/responses";
import { tryCreateSupabaseServerClient } from "@/lib/supabase/server";
import { transporterVehicleSchema } from "@/lib/validation/transporter";

export async function POST(request: Request) {
  const parsed = await parseJsonRequest(request, transporterVehicleSchema);

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
    return fail("Connecte-toi pour ajouter un vehicule.", 401);
  }

  const { error } = await supabase.from("transporter_vehicles").insert({
    active: true,
    capacity_kg: parsed.data.capacityKg,
    label: parsed.data.label,
    plate_number: parsed.data.plateNumber || null,
    profile_id: user.id,
    type: parsed.data.type,
  });

  if (error) {
    return fail(error.message, 400);
  }

  return ok("Vehicule ajoute au profil transporteur.");
}
