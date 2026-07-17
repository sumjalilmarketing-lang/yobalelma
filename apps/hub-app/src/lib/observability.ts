const correlationPattern = /^[A-Za-z0-9._-]{8,128}$/u;

type LogLevel = "error" | "info" | "warn";
type LogValue = boolean | number | string | null | undefined;

export function correlationId(request: Request) {
  const provided = request.headers.get("x-correlation-id") ?? request.headers.get("x-request-id");

  return provided && correlationPattern.test(provided) ? provided : crypto.randomUUID();
}

export function structuredLog(
  level: LogLevel,
  event: string,
  fields: Record<string, LogValue> = {},
) {
  const payload = JSON.stringify({
    at: new Date().toISOString(),
    event,
    ...Object.fromEntries(
      Object.entries(fields)
        .filter(([, value]) => value !== undefined)
        .map(([key, value]) => [key, typeof value === "string" ? redact(value) : value]),
    ),
  });

  console[level](payload);
}

export function safeErrorName(error: unknown) {
  return error instanceof Error ? error.name : "UnknownError";
}

function redact(value: string) {
  return value
    .replace(/Bearer\s+[A-Za-z0-9._-]+/giu, "Bearer [redacted]")
    .replace(/eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/gu, "jwt_[redacted]")
    .replace(/sb(?:p|_secret)_[A-Za-z0-9_-]+/gu, "sb_[redacted]")
    .replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/giu, "[email]");
}
