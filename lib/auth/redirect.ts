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
) {
  if (configuredAppUrl) {
    try {
      const configured = new URL(configuredAppUrl);

      if (configured.protocol === "https:" || configured.protocol === "http:") {
        return configured.origin;
      }
    } catch {
      // Fall back to the current request origin below.
    }
  }

  return new URL(requestUrl).origin;
}

export function buildAuthCallbackUrl(request: Request, nextPath: string) {
  const callbackUrl = new URL("/auth/callback", getTrustedAppOrigin(request.url));
  callbackUrl.searchParams.set("next", getSafeAuthRedirect(nextPath));

  return callbackUrl.toString();
}
