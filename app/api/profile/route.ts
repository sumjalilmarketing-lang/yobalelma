import { fail, ok, validationFail } from "@/lib/api/responses";
import { tryCreateSupabaseServerClient } from "@/lib/supabase/server";
import { profileSchema } from "@/lib/validation/profile";

export async function PUT(request: Request) {
  const parsed = profileSchema.safeParse(await request.json());

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
    return fail("Connecte-toi pour enregistrer ton profil.", 401);
  }

  const { error } = await supabase.from("profiles").upsert({
    id: user.id,
    email: user.email ?? "",
    full_name: parsed.data.fullName,
    phone: parsed.data.phone,
    city: parsed.data.city,
    country: parsed.data.country,
    address_line1: parsed.data.address,
    primary_role: parsed.data.role,
    role: parsed.data.role,
    preferred_language: parsed.data.preferredLanguage,
  });

  if (error) {
    return fail(error.message, 400);
  }

  return ok("Profil Yobalelma enregistre.");
}
