import { fail, ok, validationFail } from "@/lib/api/responses";
import { tryCreateSupabaseServerClient } from "@/lib/supabase/server";
import { relayPointSchema } from "@/lib/validation/relay";

export async function POST(request: Request) {
  const parsed = relayPointSchema.safeParse(await request.json());

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
    return fail("Connecte-toi pour creer un point relais.", 401);
  }

  const { error } = await supabase.from("relay_points").insert({
    address_line1: parsed.data.addressLine1,
    capacity_slots: parsed.data.capacitySlots,
    city: parsed.data.city,
    contact_name: parsed.data.contactName,
    contact_phone: parsed.data.contactPhone,
    country: parsed.data.country,
    created_by: user.id,
    name: parsed.data.name,
    postal_code: parsed.data.postalCode || null,
    status: "active",
  });

  if (error) {
    return fail(error.message, 400);
  }

  return ok("Point relais cree.");
}
