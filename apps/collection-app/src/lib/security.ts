const limits = new Map<string, { count: number; resetAt: number }>();
export function assertSameOrigin(request: Request) {
  const origin = request.headers.get("origin"); const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host");
  if (origin && host && new URL(origin).host !== host.split(",")[0]?.trim()) throw new Error("Origine de requête refusée.");
}
export function rateLimit(request: Request, limit = 60, windowMs = 60_000) {
  const key = `${request.headers.get("x-forwarded-for")?.split(",")[0] ?? "local"}:${new URL(request.url).pathname}`;
  const now = Date.now(); const current = limits.get(key);
  if (!current || current.resetAt <= now) { limits.set(key, { count: 1, resetAt: now + windowMs }); return { remaining: limit - 1, resetAt: now + windowMs }; }
  current.count += 1; if (current.count > limit) throw new Error("Trop de requêtes. Réessayez dans quelques instants.");
  return { remaining: limit - current.count, resetAt: current.resetAt };
}
export function requestOrigin(request: Request) {
  const url=new URL(request.url); const protocol=request.headers.get("x-forwarded-proto")?.split(",")[0]?.trim()||url.protocol.replace(":","")||"http";
  const host=request.headers.get("host")||request.headers.get("x-forwarded-host")?.split(",")[0]?.trim()||url.host;
  return `${protocol}://${host}`;
}
