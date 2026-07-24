const limits = new Map<string, { count: number; resetAt: number }>();

export function assertSameOrigin(request: Request) {
  const origin = request.headers.get("origin");
  const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host");
  if (origin && host && new URL(origin).host !== host.split(",")[0]?.trim()) throw new Error("Requête refusée.");
}

export function rateLimit(request: Request, limit = 40, windowMs = 60_000) {
  const key = `${request.headers.get("x-forwarded-for")?.split(",")[0] ?? "local"}:${new URL(request.url).pathname}`;
  const now = Date.now();
  if (limits.size > 2_000) for (const [entryKey, entry] of limits) if (entry.resetAt <= now) limits.delete(entryKey);
  const current = limits.get(key);
  if (!current || current.resetAt <= now) {
    limits.set(key, { count: 1, resetAt: now + windowMs });
    return;
  }
  current.count += 1;
  if (current.count > limit) throw new Error("Trop de demandes. Réessayez dans quelques instants.");
}

export function requestOrigin(request: Request) {
  const url = new URL(request.url);
  const protocol = request.headers.get("x-forwarded-proto")?.split(",")[0]?.trim() || url.protocol.replace(":", "");
  const host = request.headers.get("x-forwarded-host")?.split(",")[0]?.trim() || request.headers.get("host") || url.host;
  return `${protocol}://${host}`;
}
