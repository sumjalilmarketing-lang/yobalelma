const limits = new Map<string, { count: number; resetAt: number }>();

export function assertSameOrigin(request: Request) {
  const origin = request.headers.get("origin");
  const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host");
  if (origin && host && new URL(origin).host !== host.split(",")[0]?.trim()) {
    throw new Error("Origine refusée.");
  }
}

export function rateLimit(request: Request, limit = 10, windowMs = 60_000) {
  const now = Date.now();
  if (limits.size > 2_000) {
    for (const [key, entry] of limits) if (entry.resetAt <= now) limits.delete(key);
  }
  const address = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";
  const key = `${address}:${new URL(request.url).pathname}`;
  const current = limits.get(key);
  if (!current || current.resetAt <= now) {
    limits.set(key, { count: 1, resetAt: now + windowMs });
    return;
  }
  current.count += 1;
  if (current.count > limit) throw new Error("Trop de tentatives.");
}
