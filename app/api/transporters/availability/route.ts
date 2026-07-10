import { fail, ok, validationFail } from "@/lib/api/responses";
import { tryCreateSupabaseServerClient } from "@/lib/supabase/server";
import { transporterAvailabilitySchema } from "@/lib/validation/transporter";

export async function POST(request: Request) {
  const parsed = transporterAvailabilitySchema.safeParse(await request.json());

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
    return fail("Connecte-toi pour declarer une disponibilite.", 401);
  }

  const { error } = await supabase.from("transporter_availability").insert({
    available_on: parsed.data.availableOn,
    ends_at: parsed.data.endsAt,
    profile_id: user.id,
    starts_at: parsed.data.startsAt,
    status: "available",
  });

  if (error) {
    return fail(error.message, 400);
  }

  return ok("Disponibilite ajoutee.");
}
