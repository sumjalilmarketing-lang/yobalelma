import { fail, ok, parseJsonRequest } from "@/lib/api/responses";
import {
  getUserAppRolePath,
  isUserAppSpaceRole,
  mergePlatformRoles,
  roleDashboardPath,
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
    return fail("Le service Yobalelma n'est pas encore disponible.", 503);
  }

  const { data, error } = await supabase.auth.signInWithPassword(parsed.data);

  if (error || !data.user) {
    return fail("L’adresse e-mail ou le mot de passe est incorrect.", 401);
  }

  const [profileResult, roleAssignmentsResult, userRolesResult] = await Promise.all([
    supabase
      .from("profiles")
      .select("primary_role, role, account_status")
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
  const standaloneUserApp=isStandaloneUserApp(request);
  const role = standaloneUserApp?assignedRoles.find(isUserAppSpaceRole):assignedRoles[0];

  if (profile?.account_status !== "active" || !role) {
    await supabase.auth.signOut();
    return fail(
      profile?.account_status === "pending_email_confirmation"
        ? "Confirme ton adresse e-mail avant de te connecter."
        : "Ce compte ne peut pas accéder à cette application.",
      403,
    );
  }

  return ok("Connexion réussie.", { next: signInDestination(role,standaloneUserApp) });
}

function isStandaloneUserApp(request:Request){
  const url=new URL(request.url);
  return url.hostname==="app.yobalelma.com"||url.port==="43121"||process.env.YOBALELMA_APP_SURFACE==="user";
}
function signInDestination(role:keyof typeof roleDashboardPath,standaloneUserApp:boolean){
  return standaloneUserApp&&isUserAppSpaceRole(role)?getUserAppRolePath(role):roleDashboardPath[role];
}
