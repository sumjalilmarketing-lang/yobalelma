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
