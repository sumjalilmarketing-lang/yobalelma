import { NextResponse, type NextRequest } from "next/server";
import { tryCreateSupabaseServerClient } from "@/lib/supabase/server";
import { assertSameOrigin, rateLimit, requestOrigin } from "@collection-app/src/lib/security";

export async function POST(request: NextRequest) {
  try {
    assertSameOrigin(request); rateLimit(request, 10, 60_000);
    const data = await request.formData(); const email = String(data.get("email") ?? "").trim(); const password = String(data.get("password") ?? "");
    const returnTo = typeof data.get("returnTo") === "string" && String(data.get("returnTo")).startsWith("/") ? String(data.get("returnTo")) : "/collection";
    if (!email || !password) throw new Error("Email et mot de passe requis.");
    const supabase = await tryCreateSupabaseServerClient(); if (!supabase) throw new Error("Configuration Supabase indisponible.");
    const { error } = await supabase.auth.signInWithPassword({ email, password }); if (error) throw error;
    return NextResponse.redirect(new URL(returnTo, requestOrigin(request)), { status: 303 });
  } catch (error) { const url = new URL("/auth/sign-in", requestOrigin(request)); url.searchParams.set("error", error instanceof Error ? error.message : "Connexion refusée."); return NextResponse.redirect(url, { status: 303 }); }
}
