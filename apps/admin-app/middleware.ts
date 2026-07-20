import { NextResponse, type NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const protectedPath = pathname.startsWith("/command") || pathname.startsWith("/api/admin");
  if (!protectedPath) return NextResponse.next();
  const authenticated = request.cookies.getAll().some((cookie) => cookie.name.toLowerCase().startsWith("sb-") || cookie.name.toLowerCase().includes("supabase"));
  if (authenticated) return NextResponse.next();
  if (pathname.startsWith("/api/")) return NextResponse.json({ error: "Authentification requise." }, { status: 401 });
  const url = request.nextUrl.clone(); url.pathname = "/auth/sign-in"; url.searchParams.set("next", pathname);
  return NextResponse.redirect(url);
}

export const config = { matcher: ["/command/:path*", "/api/admin/:path*"] };
