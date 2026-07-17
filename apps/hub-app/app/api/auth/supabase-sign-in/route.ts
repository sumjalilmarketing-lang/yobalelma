import { NextResponse, type NextRequest } from "next/server";
import { tryCreateSupabaseServerClient } from "@/lib/supabase/server";
import { formString, redirectTo, requestOrigin, requestRedirect } from "@hub-app/src/lib/http";

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const returnTo = redirectTo(formData, "/hub");
  const supabase = await tryCreateSupabaseServerClient();

  if (!supabase) {
    return authError(request, returnTo, "Configuration Supabase indisponible.");
  }

  const email = formString(formData, "email");
  const password = formString(formData, "password");

  if (!email || !password) {
    return authError(request, returnTo, "Email et mot de passe requis.");
  }

  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return authError(request, returnTo, error.message);
  }

  return requestRedirect(request, returnTo);
}

function authError(request: NextRequest, returnTo: string, message: string) {
  const url = new URL("/auth/sign-in", requestOrigin(request));
  url.searchParams.set("next", returnTo);
  url.searchParams.set("error", message);

  return NextResponse.redirect(url, { status: 303 });
}
