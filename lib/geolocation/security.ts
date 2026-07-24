const windows = new Map<string, { count: number; resetAt: number }>();
export function assertLocationRateLimit(request: Request, limit = 40, windowMs = 60_000) {
  const key = `${request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown"}:${new URL(request.url).pathname}`; const now = Date.now(); const current = windows.get(key);
  if (!current || current.resetAt <= now) { windows.set(key, { count: 1, resetAt: now + windowMs }); return; }
  if (current.count >= limit) throw new Error("LOCATION_RATE_LIMITED"); current.count += 1;
}
