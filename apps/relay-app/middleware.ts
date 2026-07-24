import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { correlationId, structuredLog } from "./src/lib/observability";
import { canUseRelayRoute } from "./src/lib/permissions";
import { requestOrigin } from "./src/lib/security";
import { relaySessionCookie, verifyRelaySessionToken } from "./src/lib/session-token";
import { isRelayRole, type RelayRole } from "./src/lib/types";

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const requestId = correlationId(request);
  if (pathname === "/auth/sign-in") {
    const next = request.nextUrl.searchParams.get("next");
    if (next && (!next.startsWith("/") || next.startsWith("//") || next.includes("\\"))) {
      const url = request.nextUrl.clone();
      url.searchParams.set("next", "/relay");
      return correlated(NextResponse.redirect(url), requestId);
    }
  }
  const isPage = pathname.startsWith("/relay");
  const isApi = pathname.startsWith("/api/relay");
  if (!isPage && !isApi) return correlated(NextResponse.next(), requestId);

  const session = await verifyRelaySessionToken(request.cookies.get(relaySessionCookie)?.value);
  const supabaseAccess = session ? null : await resolveSupabaseAccess(request);
  const role = session?.role ?? supabaseAccess?.role;
  if (!role) {
    if (isApi) return correlated(NextResponse.json({ error: "Authentification requise." }, { status: 401 }), requestId);
    const url = new URL("/auth/sign-in", requestOrigin(request));
    url.searchParams.set("next", pathname);
    return correlated(NextResponse.redirect(url), requestId);
  }
  if (!canUseRelayRoute(role, pathname, request.method)) {
    return isApi
      ? correlated(NextResponse.json({ error: "Accès refusé." }, { status: 403 }), requestId)
      : correlated(NextResponse.redirect(new URL("/relay", requestOrigin(request))), requestId);
  }
  structuredLog("info", "relay_request", { method: request.method, pathname, requestId, role });
  const headers = new Headers(request.headers);
  headers.set("x-correlation-id", requestId);
  return correlated(supabaseAccess?.response ?? NextResponse.next({ request: { headers } }), requestId);
}

async function resolveSupabaseAccess(request: NextRequest): Promise<{ response: NextResponse; role: RelayRole } | null> {
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
  const [profileResult, rolesResult] = await Promise.all([
    supabase.from("profiles").select("primary_role, role").eq("id", userData.user.id).maybeSingle(),
    supabase.from("user_roles").select("role_id").eq("profile_id", userData.user.id),
  ]);
  const role = [...(rolesResult.data?.map((item) => item.role_id) ?? []), profileResult.data?.primary_role, profileResult.data?.role].find(isRelayRole);
  return role ? { response, role } : null;
}

function correlated(response: NextResponse, id: string) {
  response.headers.set("x-correlation-id", id);
  return response;
}

export const config = { matcher: ["/auth/sign-in", "/relay/:path*", "/api/relay/:path*"] };
