import { fail, ok, parseJsonRequest } from "@/lib/api/responses";
import {
  getRoleDashboardPath,
  mergePlatformRoles,
  normalizePlatformRole,
} from "@/lib/auth/roles";
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

  const [profileResult, roleAssignmentsResult, userRolesResult] = await Promise.all([
    supabase
      .from("profiles")
      .select("primary_role, role")
      .eq("id", data.user.id)
      .maybeSingle(),
    supabase
      .from("role_assignments")
      .select("role")
      .eq("profile_id", data.user.id)
      .eq("status", "active"),
    supabase
      .from("user_roles")
      .select("role_id")
      .eq("profile_id", data.user.id),
  ]);

  const profile = profileResult.data;
  const assignedRoles = mergePlatformRoles(
    [profile?.primary_role, profile?.role],
    roleAssignmentsResult.data?.map((assignment) => assignment.role) ?? [],
    userRolesResult.data?.map((assignment) => assignment.role_id) ?? [],
  );
  const role = normalizePlatformRole(profile?.primary_role) ?? assignedRoles[0] ?? "client";

  return ok("Connexion reussie.", { next: getRoleDashboardPath(role) });
}
