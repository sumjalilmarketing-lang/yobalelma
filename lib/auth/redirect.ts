export function getSafeAuthRedirect(nextParam: string | null, fallback = "/dashboard") {
  if (!nextParam) {
    return fallback;
  }

  if (!nextParam.startsWith("/") || nextParam.startsWith("//")) {
    return fallback;
  }

  return nextParam;
}
