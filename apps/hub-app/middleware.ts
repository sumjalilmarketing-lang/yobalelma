import { NextResponse, type NextRequest } from "next/server";
import { canUseHubRoute } from "./src/lib/permissions";
import { hubSessionCookie, verifyHubSessionToken } from "./src/lib/session-token";
import { correlationId, structuredLog } from "./src/lib/observability";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const requestId = correlationId(request);
  const isHubPage = pathname.startsWith("/hub");
  const isHubApi = pathname.startsWith("/api/hub");

  if (!isHubPage && !isHubApi) {
    return withCorrelation(NextResponse.next(), requestId);
  }

  const session = await verifyHubSessionToken(request.cookies.get(hubSessionCookie)?.value);

  if (!session && hasSupabaseAuthCookie(request)) {
    const headers = new Headers(request.headers);
    headers.set("x-correlation-id", requestId);
    structuredLog("info", "hub_request_supabase_session", { method: request.method, path: pathname, requestId });
    return withCorrelation(NextResponse.next({ request: { headers } }), requestId);
  }

  if (!session) {
    if (isHubApi) {
      structuredLog("warn", "hub_api_unauthenticated", { method: request.method, path: pathname, requestId });
      return withCorrelation(NextResponse.json({ error: "Authentication required." }, { status: 401 }), requestId);
    }

    const signIn = new URL("/auth/sign-in", request.url);
    signIn.searchParams.set("next", pathname);
    return withCorrelation(NextResponse.redirect(signIn), requestId);
  }

  if (!canUseHubRoute(session.role, pathname, request.method)) {
    if (isHubApi) {
      structuredLog("warn", "hub_api_forbidden", { method: request.method, path: pathname, requestId, role: session.role });
      return withCorrelation(NextResponse.json({ error: "Hub access denied." }, { status: 403 }), requestId);
    }

    return withCorrelation(NextResponse.redirect(new URL("/hub", request.url)), requestId);
  }

  const headers = new Headers(request.headers);
  headers.set("x-correlation-id", requestId);
  structuredLog("info", "hub_request_authorized", { method: request.method, path: pathname, requestId, role: session.role });

  return withCorrelation(NextResponse.next({ request: { headers } }), requestId);
}

function withCorrelation(response: NextResponse, requestId: string) {
  response.headers.set("x-correlation-id", requestId);
  return response;
}

function hasSupabaseAuthCookie(request: NextRequest) {
  return request.cookies.getAll().some((cookie) => {
    const name = cookie.name.toLowerCase();

    return name.startsWith("sb-") || name.includes("supabase");
  });
}

export const config = {
  matcher: ["/hub/:path*", "/api/hub/:path*"],
};
