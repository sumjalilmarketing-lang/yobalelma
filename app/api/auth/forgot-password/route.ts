import { fail, ok, parseJsonRequest } from "@/lib/api/responses";
import { buildAuthCallbackUrl } from "@/lib/auth/redirect";
import { tryCreateSupabaseServerClient } from "@/lib/supabase/server";
import { forgotPasswordSchema } from "@/lib/validation/auth";

export async function POST(request: Request) {
  const parsed = await parseJsonRequest(request, forgotPasswordSchema);

  if (!parsed.ok) {
    return parsed.response;
  }

  const supabase = await tryCreateSupabaseServerClient();

  if (!supabase) {
    return fail("Supabase n'est pas encore configure dans l'environnement local.", 503);
  }

  const { error } = await supabase.auth.resetPasswordForEmail(parsed.data.email, {
    redirectTo: buildAuthCallbackUrl(request, "/auth/reset-password"),
  });

  if (error) {
    return fail(error.message, 400);
  }

  return ok("Email de reinitialisation envoye si le compte existe.");
}
