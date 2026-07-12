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

export async function middleware(request: NextRequest) {
  for (const [from, to] of legacyRedirects) {
    if (request.nextUrl.pathname === from || request.nextUrl.pathname.startsWith(`${from}/`)) {
      const redirectUrl = request.nextUrl.clone();
      redirectUrl.pathname = request.nextUrl.pathname.replace(from, to);
      return NextResponse.redirect(redirectUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/dashboard",
    "/auth/sign-in",
    "/auth/sign-up",
    "/suivi/:path*",
    "/suivi"
  ]
};
