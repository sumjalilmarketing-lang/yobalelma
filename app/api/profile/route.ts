import { fail, ok, parseJsonRequest } from "@/lib/api/responses";
import { tryCreateSupabaseServerClient } from "@/lib/supabase/server";
import { profileSchema } from "@/lib/validation/profile";

export async function PUT(request: Request) {
  const parsed = await parseJsonRequest(request, profileSchema);

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
