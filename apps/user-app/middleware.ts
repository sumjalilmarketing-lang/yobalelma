import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";

const legacyRedirects = [
  ["/dashboard/client", "/client"],
  ["/dashboard/transporter", "/transporter"],
  ["/dashboard/traveler", "/traveler"],
  ["/dashboard", "/client"],
  ["/auth/sign-in", "/auth/login"],
  ["/auth/sign-up", "/auth/register"],
  ["/suivi", "/tracking"]
] as const;

const protectedPrefixes = ["/client", "/transporter", "/traveler"] as const;

export async function middleware(request: NextRequest) {
  for (const [from, to] of legacyRedirects) {
    if (request.nextUrl.pathname === from || request.nextUrl.pathname.startsWith(`${from}/`)) {
      const redirectUrl = createForwardedUrl(request);
      redirectUrl.pathname = request.nextUrl.pathname.replace(from, to);
      return NextResponse.redirect(redirectUrl);
    }
  }

  if (!protectedPrefixes.some((prefix) => request.nextUrl.pathname.startsWith(prefix))) {
    return NextResponse.next();
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return NextResponse.next();
  }

  let response = NextResponse.next({ request });
  const supabase = createServerClient(supabaseUrl, supabaseKey, {
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
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    return response;
  }

  const redirectUrl = createForwardedUrl(request);
  redirectUrl.pathname = "/auth/login";
  redirectUrl.search = "";
  redirectUrl.searchParams.set(
    "next",
    `${request.nextUrl.pathname}${request.nextUrl.search}`,
  );

  return NextResponse.redirect(redirectUrl);
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/dashboard",
    "/auth/sign-in",
    "/auth/sign-up",
    "/suivi/:path*",
    "/suivi",
    "/client/:path*",
    "/client",
    "/transporter/:path*",
    "/transporter",
    "/traveler/:path*",
    "/traveler"
  ]
};

function createForwardedUrl(request: NextRequest) {
  return new URL(
    `${request.nextUrl.pathname}${request.nextUrl.search}`,
    getForwardedOrigin(request),
  );
}

function getForwardedOrigin(request: NextRequest) {
  const forwardedHost = firstHeaderValue(request.headers.get("x-forwarded-host"));
  const host = forwardedHost ?? firstHeaderValue(request.headers.get("host"));

  if (!host) {
    return request.nextUrl.origin;
  }

  const forwardedProto = firstHeaderValue(request.headers.get("x-forwarded-proto"));
  const protocol = forwardedProto === "http" || forwardedProto === "https"
    ? forwardedProto
    : request.nextUrl.protocol.replace(":", "");

  return `${protocol}://${host}`;
}

function firstHeaderValue(value: string | null) {
  return value?.split(",")[0]?.trim() || undefined;
}
