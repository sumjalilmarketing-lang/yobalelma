import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { canUseHubRoute } from "./src/lib/permissions";
import { hubSessionCookie, verifyHubSessionToken } from "./src/lib/session-token";
import { correlationId, structuredLog } from "./src/lib/observability";
import { isHubRole, type HubRole } from "./src/lib/types";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const requestId = correlationId(request);
  const isHubPage = pathname.startsWith("/hub");
  const isHubApi = pathname.startsWith("/api/hub");

  if (!isHubPage && !isHubApi) {
    return withCorrelation(NextResponse.next(), requestId);
  }

  const session = await verifyHubSessionToken(request.cookies.get(hubSessionCookie)?.value);
  const supabaseAccess = session ? null : await resolveSupabaseAccess(request);
  const role = session?.role ?? supabaseAccess?.role;

  if (!role) {
    if (isHubApi) {
      structuredLog("warn", "hub_api_unauthenticated", { method: request.method, path: pathname, requestId });
      return withCorrelation(NextResponse.json({ error: "Authentication required." }, { status: 401 }), requestId);
    }

    const signIn = new URL("/auth/sign-in", requestOrigin(request));
    signIn.searchParams.set("next", pathname);
    return withCorrelation(NextResponse.redirect(signIn), requestId);
  }

  if (!canUseHubRoute(role, pathname, request.method)) {
    if (isHubApi) {
      structuredLog("warn", "hub_api_forbidden", { method: request.method, path: pathname, requestId, role });
      return withCorrelation(NextResponse.json({ error: "Hub access denied." }, { status: 403 }), requestId);
    }

    return withCorrelation(NextResponse.redirect(new URL("/hub", requestOrigin(request))), requestId);
  }

  const headers = new Headers(request.headers);
  headers.set("x-correlation-id", requestId);
  structuredLog("info", "hub_request_authorized", { method: request.method, path: pathname, requestId, role });

  const response = supabaseAccess?.response ?? NextResponse.next({ request: { headers } });
  return withCorrelation(response, requestId);
}

function requestOrigin(request: NextRequest) {
  const protocol = request.headers.get("x-forwarded-proto")?.split(",")[0]?.trim()
    || request.nextUrl.protocol.replace(/:$/u, "")
    || "http";
  const host = request.headers.get("x-forwarded-host")?.split(",")[0]?.trim()
    || request.headers.get("host")
    || request.nextUrl.host;

  return `${protocol}://${host}`;
}

function withCorrelation(response: NextResponse, requestId: string) {
  response.headers.set("x-correlation-id", requestId);
  return response;
}

async function resolveSupabaseAccess(request: NextRequest): Promise<{ response: NextResponse; role: HubRole } | null> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;

  let response = NextResponse.next({ request });
  const supabase = createServerClient(url, key, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (cookiesToSet) => {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      },
    },
  });
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return null;
  const [profileResult, rolesResult] = await Promise.all([
    supabase.from("profiles").select("primary_role, role").eq("id", userData.user.id).maybeSingle(),
    supabase.from("user_roles").select("role_id").eq("profile_id", userData.user.id),
  ]);
  const role = [
    ...(rolesResult.data?.map((item) => item.role_id) ?? []),
    profileResult.data?.primary_role,
    profileResult.data?.role,
  ].find(isHubRole);
  return role ? { response, role } : null;
}

export const config = {
  matcher: ["/hub/:path*", "/api/hub/:path*"],
};
