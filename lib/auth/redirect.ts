export function getSafeAuthRedirect(nextParam: string | null, fallback = "/dashboard") {
  if (!nextParam) {
    return fallback;
  }

  if (
    nextParam.length > 2048 ||
    !nextParam.startsWith("/") ||
    nextParam.startsWith("//") ||
    nextParam.includes("\\") ||
    /[\u0000-\u001F\u007F]/.test(nextParam)
  ) {
    return fallback;
  }

  try {
    const parsed = new URL(nextParam, "https://yobalelma.local");

    if (parsed.origin !== "https://yobalelma.local") {
      return fallback;
    }

    return `${parsed.pathname}${parsed.search}${parsed.hash}`;
  } catch {
    return fallback;
  }
}

export function getTrustedAppOrigin(
  requestUrl: string,
  configuredAppUrl = process.env.NEXT_PUBLIC_APP_URL,
  headers?: Headers,
) {
  const requestOrigin = getRequestOrigin(requestUrl, headers);

  if (configuredAppUrl) {
    try {
      const configured = new URL(configuredAppUrl);

      if (configured.protocol === "https:" || configured.protocol === "http:") {
        if (isLocalOrigin(configured.origin) && !isLocalOrigin(requestOrigin)) {
          return requestOrigin;
        }

        return configured.origin;
      }
    } catch {
      // Fall back to the current request origin below.
    }
  }

  return requestOrigin;
}

export function buildAuthCallbackUrl(request: Request, nextPath: string) {
  const callbackUrl = new URL(
    "/auth/callback",
    getTrustedAppOrigin(request.url, process.env.NEXT_PUBLIC_APP_URL, request.headers),
  );
  callbackUrl.searchParams.set("next", getSafeAuthRedirect(nextPath));

  return callbackUrl.toString();
}

function getRequestOrigin(requestUrl: string, headers?: Headers) {
  const url = new URL(requestUrl);
  const forwardedHost = firstHeaderValue(headers?.get("x-forwarded-host"));
  const host = forwardedHost ?? firstHeaderValue(headers?.get("host"));

  if (!host) {
    return url.origin;
  }

  const forwardedProto = firstHeaderValue(headers?.get("x-forwarded-proto"));
  const protocol = forwardedProto === "http" || forwardedProto === "https"
    ? forwardedProto
    : url.protocol.replace(":", "");

  return `${protocol}://${host}`;
}

function firstHeaderValue(value: string | null | undefined) {
  return value?.split(",")[0]?.trim() || undefined;
}

function isLocalOrigin(origin: string) {
  try {
    const { hostname } = new URL(origin);

    return hostname === "localhost" || hostname === "127.0.0.1" || hostname === "::1";
  } catch {
    return false;
  }
}
