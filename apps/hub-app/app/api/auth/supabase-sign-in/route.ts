import { NextResponse, type NextRequest } from "next/server";
import { tryCreateSupabaseServerClient } from "@/lib/supabase/server";
import { formString, redirectTo, requestOrigin, requestRedirect } from "@hub-app/src/lib/http";
import { assertSameOrigin, rateLimit } from "@hub-app/src/lib/security";

export async function POST(request: NextRequest) {
  try {
    assertSameOrigin(request);
    rateLimit(request);
  } catch {
    return authError(request, "/hub", "La connexion a été refusée. Réessaie dans quelques instants.");
  }
  const formData = await request.formData();
  const returnTo = redirectTo(formData, "/hub");
  const supabase = await tryCreateSupabaseServerClient();

  if (!supabase) {
    return authError(request, returnTo, "La connexion est momentanément indisponible.");
  }

  const email = formString(formData, "email");
  const password = formString(formData, "password");

  if (!email || !password) {
    return authError(request, returnTo, "Email et mot de passe requis.");
  }

  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return authError(request, returnTo, "Les informations de connexion sont incorrectes ou l’accès n’est pas autorisé.");
  }

  return requestRedirect(request, returnTo);
}

function authError(request: NextRequest, returnTo: string, message: string) {
  const url = new URL("/auth/sign-in", requestOrigin(request));
  url.searchParams.set("next", returnTo);
  url.searchParams.set("error", message);

  return NextResponse.redirect(url, { status: 303 });
}
