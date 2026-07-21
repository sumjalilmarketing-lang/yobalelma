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
    return fail("Le service Yobalelma n'est pas encore disponible.", 503);
  }

  await supabase.auth.resetPasswordForEmail(parsed.data.email, {
    redirectTo: buildAuthCallbackUrl(request, "/auth/reset-password"),
  });

  return ok("Si un compte correspond à cette adresse, un lien de réinitialisation sera envoyé.");
}
