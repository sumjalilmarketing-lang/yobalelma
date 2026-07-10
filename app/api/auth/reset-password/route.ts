import { fail, ok, validationFail } from "@/lib/api/responses";
import { tryCreateSupabaseServerClient } from "@/lib/supabase/server";
import { resetPasswordSchema } from "@/lib/validation/auth";

export async function POST(request: Request) {
  const parsed = resetPasswordSchema.safeParse(await request.json());

  if (!parsed.success) {
    return validationFail(parsed.error);
  }

  const supabase = await tryCreateSupabaseServerClient();

  if (!supabase) {
    return fail("Supabase n'est pas encore configure dans l'environnement local.", 503);
  }

  const { error } = await supabase.auth.updateUser({
    password: parsed.data.password,
  });

  if (error) {
    return fail(error.message, 400);
  }

  return ok("Mot de passe mis a jour.");
}

