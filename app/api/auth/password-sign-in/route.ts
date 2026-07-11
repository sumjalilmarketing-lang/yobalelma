import { fail, ok, parseJsonRequest } from "@/lib/api/responses";
import { getRoleDashboardPath, isPlatformRole } from "@/lib/auth/roles";
import { tryCreateSupabaseServerClient } from "@/lib/supabase/server";
import { signInSchema } from "@/lib/validation/auth";

export async function POST(request: Request) {
  const parsed = await parseJsonRequest(request, signInSchema);

  if (!parsed.ok) {
    return parsed.response;
  }

  const supabase = await tryCreateSupabaseServerClient();

  if (!supabase) {
    return fail("Supabase n'est pas encore configure dans l'environnement local.", 503);
  }

  const { data, error } = await supabase.auth.signInWithPassword(parsed.data);

  if (error || !data.user) {
    return fail(error?.message ?? "Connexion impossible.", 401);
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("primary_role")
    .eq("id", data.user.id)
    .maybeSingle();

  const role =
    profile?.primary_role && isPlatformRole(profile.primary_role)
      ? profile.primary_role
      : "client";

  return ok("Connexion reussie.", { next: getRoleDashboardPath(role) });
}

