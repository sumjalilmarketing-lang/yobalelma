import { NextResponse, type NextRequest } from "next/server";
import { tryCreateSupabaseServerClient } from "@/lib/supabase/server";
import { assertSameOrigin, rateLimit, requestOrigin } from "@admin-app/src/lib/security";

export async function POST(request: NextRequest) {
  try {
    assertSameOrigin(request); rateLimit(request, 10, 60_000);
    const data = await request.formData();
    const email = String(data.get("email") ?? "").trim();
    const password = String(data.get("password") ?? "");
    const requested = String(data.get("returnTo") ?? "/command");
    const returnTo = requested.startsWith("/") && !requested.startsWith("//") ? requested : "/command";
    if (!email || !password) throw new Error("missing credentials");
    const supabase = await tryCreateSupabaseServerClient();
    if (!supabase) throw new Error("unavailable");
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    const factors = await supabase.auth.mfa.listFactors();
    if (factors.error) throw factors.error;
    if ((factors.data.totp ?? []).some((factor) => factor.status === "verified")) {
      const mfaUrl = new URL("/auth/mfa", requestOrigin(request));
      mfaUrl.searchParams.set("next", returnTo);
      return NextResponse.redirect(mfaUrl, { status: 303 });
    }
    return NextResponse.redirect(new URL(returnTo, requestOrigin(request)), { status: 303 });
  } catch {
    const url = new URL("/auth/sign-in", requestOrigin(request));
    url.searchParams.set("error", "Les informations de connexion sont incorrectes ou l’accès n’est pas autorisé.");
    return NextResponse.redirect(url, { status: 303 });
  }
}
