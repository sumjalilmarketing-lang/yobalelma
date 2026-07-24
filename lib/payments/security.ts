import { PaymentProviderUnavailableError } from "./providers";

const windows = new Map<string, { count: number; resetAt: number }>();
const sensitiveKey = /authorization|client.?secret|merchant.?key|otp|password|pin|secret|signature|token|msisdn|phone/i;

export function assertPaymentRateLimit(request: Request, limit = 20, windowMs = 60_000) {
  const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  const key = `${forwarded || "unknown"}:${new URL(request.url).pathname}`;
  const now = Date.now();
  const current = windows.get(key);
  if (!current || current.resetAt <= now) {
    windows.set(key, { count: 1, resetAt: now + windowMs });
    return;
  }
  if (current.count >= limit) throw new PaymentProviderUnavailableError("Trop de tentatives. Réessaie dans quelques instants.");
  current.count += 1;
}

export function assertSameOrigin(request: Request) {
  const origin = request.headers.get("origin");
  if (!origin) return;
  const requestUrl = new URL(request.url);
  if (new URL(origin).host !== requestUrl.host) throw new PaymentProviderUnavailableError("Origine de la demande non autorisée.");
}

export function requireIdempotencyKey(request: Request) {
  const value = request.headers.get("idempotency-key")?.trim();
  if (!value || !/^[a-zA-Z0-9:._-]{16,160}$/u.test(value)) {
    throw new PaymentProviderUnavailableError("Clé d’idempotence requise.");
  }
  return value;
}

export function assertFreshWebhook(receivedAt: Date, now = new Date(), toleranceMs = 5 * 60_000) {
  if (Math.abs(now.getTime() - receivedAt.getTime()) > toleranceMs) {
    throw new PaymentProviderUnavailableError("Notification de paiement expirée.");
  }
}

export function sanitizePaymentPayload(value: unknown, depth = 0): unknown {
  if (depth > 6) return "[TRUNCATED]";
  if (Array.isArray(value)) return value.slice(0, 100).map((item) => sanitizePaymentPayload(item, depth + 1));
  if (!value || typeof value !== "object") return typeof value === "string" ? value.slice(0, 1000) : value;
  return Object.fromEntries(Object.entries(value as Record<string, unknown>)
    .filter(([key]) => !sensitiveKey.test(key))
    .slice(0, 100)
    .map(([key, item]) => [key, sanitizePaymentPayload(item, depth + 1)]));
}

export function internalPaymentReference() {
  return `pay_${crypto.randomUUID()}`;
}
