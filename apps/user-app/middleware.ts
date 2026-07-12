import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";
import { getOptionalPublicEnv } from "@/lib/env";

const protectedPrefixes = ["/client", "/transporter", "/traveler"];
const legacyRedirects = [
  ["/dashboard/client", "/client"],
  ["/dashboard/transporter", "/transporter"],
  ["/dashboard/traveler", "/traveler"],
  ["/dashboard", "/client"],
  ["/auth/sign-in", "/auth/login"],
  ["/auth/sign-up", "/auth/register"],
  ["/suivi", "/tracking"]
] as const;

export async function middleware(request: NextRequest) {
  for (const [from, to] of legacyRedirects) {
    if (request.nextUrl.pathname === from || request.nextUrl.pathname.startsWith(`${from}/`)) {
      const redirectUrl = request.nextUrl.clone();
      redirectUrl.pathname = request.nextUrl.pathname.replace(from, to);
      return NextResponse.redirect(redirectUrl);
    }
  }

  const env = getOptionalPublicEnv();

  if (!env) {
    return NextResponse.next();
  }

  let response = NextResponse.next({ request });
  const supabase = createServerClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set(name, value);
            response = NextResponse.next({ request });
            response.cookies.set(name, value, options);
          });
        }
      }
    }
  );

  const { data: { user } } = await supabase.auth.getUser();

  if (!user && protectedPrefixes.some((prefix) => request.nextUrl.pathname.startsWith(prefix))) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/auth/login";
    redirectUrl.searchParams.set("next", request.nextUrl.pathname);
    return NextResponse.redirect(redirectUrl);
  }

  return response;
}

export const config = {
  matcher: [
    "/client/:path*",
    "/transporter/:path*",
    "/traveler/:path*",
    "/dashboard/:path*",
    "/dashboard",
    "/auth/sign-in",
    "/auth/sign-up",
    "/suivi/:path*",
    "/suivi"
  ]
};
