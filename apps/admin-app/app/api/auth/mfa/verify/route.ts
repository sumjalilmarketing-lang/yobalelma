import { NextResponse, type NextRequest } from "next/server";
import { tryCreateSupabaseServerClient } from "@/lib/supabase/server";
import { assertSameOrigin, rateLimit, requestOrigin } from "@admin-app/src/lib/security";

export async function POST(request: NextRequest) {
  let returnTo = "/command";
  try {
    assertSameOrigin(request);
    rateLimit(request, 8, 60_000);
    const form = await request.formData();
    const requested = String(form.get("returnTo") ?? "/command");
    returnTo = requested.startsWith("/") && !requested.startsWith("//") ? requested : "/command";
    const code = String(form.get("code") ?? "").trim();
    if (!/^\d{6}$/u.test(code)) throw new Error("invalid code");
    const supabase = await tryCreateSupabaseServerClient();
    if (!supabase) throw new Error("unavailable");
    const factors = await supabase.auth.mfa.listFactors();
    if (factors.error) throw factors.error;
    const factor = (factors.data.totp ?? []).find((item) => item.status === "verified");
    if (!factor) throw new Error("factor missing");
    const verified = await supabase.auth.mfa.challengeAndVerify({ factorId: factor.id, code });
    if (verified.error) throw verified.error;
    return NextResponse.redirect(new URL(returnTo, requestOrigin(request)), { status: 303 });
  } catch {
    const url = new URL("/auth/mfa", requestOrigin(request));
    url.searchParams.set("next", returnTo);
    url.searchParams.set("error", "verification");
    return NextResponse.redirect(url, { status: 303 });
  }
}
