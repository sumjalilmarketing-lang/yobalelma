import { NextResponse } from "next/server";
import { fail, ok, parseJsonRequest } from "@/lib/api/responses";
import { buildAuthCallbackUrl } from "@/lib/auth/redirect";
import { tryCreateSupabaseServerClient } from "@/lib/supabase/server";
import { emailAuthSchema } from "@/lib/validation/auth";

export async function POST(request: Request) {
  const parsed = await parseJsonRequest(request, emailAuthSchema);

  if (!parsed.ok) {
    return parsed.response;
  }

  const supabase = await tryCreateSupabaseServerClient();

  if (!supabase) {
    return fail("Le service Yobalelma n'est pas encore disponible.", 503);
  }

  const { error } = await supabase.auth.signInWithOtp({
    email: parsed.data.email,
    options: {
      emailRedirectTo: buildAuthCallbackUrl(request, "/dashboard"),
    },
  });

  if (error) {
    return fail(error.message, 400);
  }

  return ok("Lien magique envoye. Verifie ta boite email pour continuer.");
}

export function GET() {
  return NextResponse.json({ ok: false, message: "Method not allowed." }, { status: 405 });
}
