import { NextResponse, type NextRequest } from "next/server";
import { canUseRelayRoute } from "./src/lib/permissions";
import { relaySessionCookie, verifyRelaySessionToken } from "./src/lib/session-token";
import { correlationId, structuredLog } from "./src/lib/observability";
import { requestOrigin } from "./src/lib/security";

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname; const requestId = correlationId(request);
  const isPage = pathname.startsWith("/relay"); const isApi = pathname.startsWith("/api/relay");
  if (!isPage && !isApi) return correlated(NextResponse.next(), requestId);
  const session = await verifyRelaySessionToken(request.cookies.get(relaySessionCookie)?.value);
  const hasSupabaseCookie = request.cookies.getAll().some((cookie) => cookie.name.startsWith("sb-") || cookie.name.includes("supabase"));
  if (!session && hasSupabaseCookie) return correlated(NextResponse.next(), requestId);
  if (!session) {
    if (isApi) return correlated(NextResponse.json({ error: "Authentification requise." }, { status: 401 }), requestId);
    const url = new URL("/auth/sign-in", requestOrigin(request)); url.searchParams.set("next", pathname); return correlated(NextResponse.redirect(url), requestId);
  }
  if (!canUseRelayRoute(session.role, pathname, request.method)) return isApi ? correlated(NextResponse.json({ error: "Accès refusé." }, { status: 403 }), requestId) : correlated(NextResponse.redirect(new URL("/relay", requestOrigin(request))), requestId);
  structuredLog("info", "relay_request", { method: request.method, pathname, requestId, role: session.role });
  const headers = new Headers(request.headers); headers.set("x-correlation-id", requestId);
  return correlated(NextResponse.next({ request: { headers } }), requestId);
}
function correlated(response: NextResponse, id: string) { response.headers.set("x-correlation-id", id); return response; }
export const config = { matcher: ["/relay/:path*", "/api/relay/:path*"] };
