const idPattern = /^[A-Za-z0-9._-]{8,128}$/u;
export function correlationId(request: Request) { const candidate = request.headers.get("x-correlation-id") ?? request.headers.get("x-request-id"); return candidate && idPattern.test(candidate) ? candidate : crypto.randomUUID(); }
export function structuredLog(level: "info" | "warn" | "error", event: string, fields: Record<string, unknown> = {}) {
  const safe = Object.fromEntries(Object.entries(fields).map(([key, value]) => [key, typeof value === "string" ? value.replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/giu, "[email]").replace(/Bearer\s+\S+/giu, "Bearer [redacted]") : value]));
  console[level](JSON.stringify({ at: new Date().toISOString(), event, ...safe }));
}
