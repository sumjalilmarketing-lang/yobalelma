import { NextResponse, type NextRequest } from "next/server";
import { getHubSession } from "./auth";
import { assertHubRouteAccess } from "./permissions";
import { hubSessionCookie } from "./session-token";
import { correlationId, safeErrorName, structuredLog } from "./observability";

export function redirectTo(formData: FormData, fallback = "/hub") {
  const value = formData.get("returnTo");

  return typeof value === "string" && value.startsWith("/") ? value : fallback;
}

export function requestOrigin(request: NextRequest) {
  const forwardedProtocol = request.headers.get("x-forwarded-proto")?.split(",")[0]?.trim();
  const protocol = forwardedProtocol || request.nextUrl.protocol.replace(/:$/u, "") || "http";
  const host = request.headers.get("host") || request.nextUrl.host;

  return `${protocol}://${host}`;
}

export function requestRedirect(request: NextRequest, pathname: string, status = 303) {
  const safePathname = pathname.startsWith("/") ? pathname : "/hub";
  const requestId = correlationId(request);
  structuredLog("info", "hub_api_completed", {
    method: request.method,
    path: request.nextUrl.pathname,
    requestId,
    status,
  });

  const response = NextResponse.redirect(new URL(safePathname, requestOrigin(request)), { status });
  response.headers.set("x-correlation-id", requestId);
  return response;
}

export function formString(formData: FormData, name: string, fallback = "") {
  const value = formData.get(name);

  return typeof value === "string" ? value.trim() : fallback;
}

export function formBoolean(formData: FormData, name: string) {
  return formData.get(name) === "true" || formData.get(name) === "on";
}

export function formNumber(formData: FormData, name: string, fallback = 0) {
  const value = Number(formData.get(name));

  return Number.isFinite(value) ? value : fallback;
}

export async function requireHubApiSession(request: NextRequest) {
  const session = await getHubSession();

  if (!session) {
    throw new Error("Authentication required.");
  }

  assertHubRouteAccess(session.role, request.nextUrl.pathname, request.method);

  return session;
}

export function actionRedirect(request: NextRequest, pathname: string) {
  return requestRedirect(request, pathname);
}

export function actionError(request: NextRequest, error: unknown, returnTo = "/hub") {
  const message = error instanceof Error ? error.message : "Hub operation failed.";
  const url = new URL(returnTo.startsWith("/") ? returnTo : "/hub", requestOrigin(request));
  url.searchParams.set("error", message);
  const requestId = correlationId(request);
  structuredLog("error", "hub_api_failed", {
    errorName: safeErrorName(error),
    method: request.method,
    path: request.nextUrl.pathname,
    requestId,
  });

  const response = NextResponse.redirect(url, { status: 303 });
  response.headers.set("x-correlation-id", requestId);
  return response;
}

export function clearHubSessionResponse(request: NextRequest, returnTo = "/auth/sign-in") {
  const response = requestRedirect(request, returnTo);
  response.cookies.set(hubSessionCookie, "", { httpOnly: true, maxAge: 0, path: "/", sameSite: "lax", secure: process.env.NODE_ENV === "production" });

  return response;
}
