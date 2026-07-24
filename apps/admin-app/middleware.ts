import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const protectedPath = pathname.startsWith("/command") || pathname.startsWith("/api/admin");
  if (!protectedPath) return NextResponse.next();
  const access = await resolveAccess(request);
  if (!access) {
    if (pathname.startsWith("/api/")) return NextResponse.json({ error: "Authentification requise." }, { status: 401 });
    const url = request.nextUrl.clone();
    url.pathname = "/auth/sign-in";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }
  if (access.requiresMfa) {
    if (pathname.startsWith("/api/")) return NextResponse.json({ error: "Vérification renforcée requise." }, { status: 403 });
    const url = request.nextUrl.clone();
    url.pathname = "/auth/mfa";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }
  return access.response;
}

async function resolveAccess(request: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  let response = NextResponse.next({ request });
  const supabase = createServerClient(url, key, { cookies: {
    getAll: () => request.cookies.getAll(),
    setAll: (items) => {
      items.forEach(({ name, value }) => request.cookies.set(name, value));
      response = NextResponse.next({ request });
      items.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
    },
  } });
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return null;
  const assurance = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
  return { response, requiresMfa: assurance.data?.currentLevel !== "aal2" };
}

export const config = { matcher: ["/command/:path*", "/api/admin/:path*"] };
