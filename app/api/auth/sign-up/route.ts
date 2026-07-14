import { fail, ok, parseJsonRequest } from "@/lib/api/responses";
import { buildAuthCallbackUrl } from "@/lib/auth/redirect";
import { getRoleDashboardPath } from "@/lib/auth/roles";
import { tryCreateSupabaseServerClient } from "@/lib/supabase/server";
import { tryCreateSupabaseServiceClient } from "@/lib/supabase/service";
import { signUpSchema } from "@/lib/validation/auth";

export async function POST(request: Request) {
  const parsed = await parseJsonRequest(request, signUpSchema);

  if (!parsed.ok) {
    return parsed.response;
  }

  const supabase = await tryCreateSupabaseServerClient();

  if (!supabase) {
    return fail("Le service Yobalelma n'est pas encore disponible.", 503);
  }

  const roleDashboard = getRoleDashboardPath(parsed.data.role);
  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      emailRedirectTo: buildAuthCallbackUrl(request, roleDashboard),
      data: {
        full_name: parsed.data.fullName,
        phone: parsed.data.phone,
        country: parsed.data.country,
        city: parsed.data.city,
        address_line1: parsed.data.address,
        primary_role: parsed.data.role,
      },
    },
  });

  if (error) {
    return fail(error.message, 400);
  }

  if (data.user) {
    const { error: profileError } = await supabase.from("profiles").upsert({
      id: data.user.id,
      email: parsed.data.email,
      full_name: parsed.data.fullName,
      phone: parsed.data.phone,
      country: parsed.data.country,
      city: parsed.data.city,
      address_line1: parsed.data.address,
      primary_role: parsed.data.role,
      role: parsed.data.role,
      account_status: "pending_email_confirmation",
      preferred_language: "fr",
    });

    if (profileError) {
      return fail("Compte cree, mais le profil Yobalelma n'a pas pu etre initialise.", 500);
    }

    const roleError = await assignSignupRole(data.user.id, parsed.data.role);

    if (roleError) {
      return fail("Compte cree, mais l'attribution du role n'a pas pu etre finalisee.", 500);
    }
  }

  return ok("Compte cree. Verifie ton email pour confirmer ton inscription.", {
    next: roleDashboard,
  });
}

async function assignSignupRole(userId: string, role: "client" | "local_transporter" | "traveler") {
  const service = tryCreateSupabaseServiceClient();

  if (!service) {
    return null;
  }

  const { error: userRoleError } = await service
    .from("user_roles")
    .upsert(
      {
        profile_id: userId,
        role_id: role,
      },
      { onConflict: "profile_id,role_id" },
    );

  if (userRoleError) {
    return userRoleError;
  }

  const { data: existingAssignment, error: existingAssignmentError } = await service
    .from("role_assignments")
    .select("id")
    .eq("profile_id", userId)
    .eq("role", role)
    .eq("status", "active")
    .maybeSingle();

  if (existingAssignmentError) {
    return existingAssignmentError;
  }

  if (existingAssignment) {
    return null;
  }

  const { error: assignmentError } = await service.from("role_assignments").insert({
    profile_id: userId,
    role,
    reason: "public_signup",
    status: "active",
  });

  return assignmentError;
}
