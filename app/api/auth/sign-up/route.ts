import { fail, ok, parseJsonRequest } from "@/lib/api/responses";
import { getRoleDashboardPath } from "@/lib/auth/roles";
import { tryCreateSupabaseServerClient } from "@/lib/supabase/server";
import { signUpSchema } from "@/lib/validation/auth";

export async function POST(request: Request) {
  const parsed = await parseJsonRequest(request, signUpSchema);

  if (!parsed.ok) {
    return parsed.response;
  }

  const supabase = await tryCreateSupabaseServerClient();

  if (!supabase) {
    return fail("Supabase n'est pas encore configure dans l'environnement local.", 503);
  }

  const origin = request.headers.get("origin") ?? new URL(request.url).origin;
  const roleDashboard = getRoleDashboardPath(parsed.data.role);
  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      emailRedirectTo: `${origin}/auth/callback?next=${encodeURIComponent(roleDashboard)}`,
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
    await supabase.from("profiles").upsert({
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
  }

  return ok("Compte cree. Verifie ton email pour confirmer ton inscription.", {
    next: roleDashboard,
  });
}
