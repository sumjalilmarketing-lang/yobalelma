import { fail, ok, parseJsonRequest } from "@/lib/api/responses";
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

  const origin = request.headers.get("origin") ?? new URL(request.url).origin;
  const { error } = await supabase.auth.resetPasswordForEmail(parsed.data.email, {
    redirectTo: `${origin}/auth/callback?next=/auth/reset-password`,
  });

  if (error) {
    return fail(error.message, 400);
  }

  return ok("Email de reinitialisation envoye si le compte existe.");
}

