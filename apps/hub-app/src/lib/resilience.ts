export type RetryOptions = { attempts?: number; baseDelayMs?: number; retryable?: (error: unknown) => boolean };

export async function withRetry<T>(operation: (attempt: number) => Promise<T>, options: RetryOptions = {}): Promise<T> {
  const attempts = options.attempts ?? 3;
  const baseDelayMs = options.baseDelayMs ?? 150;
  let lastError: unknown;
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try { return await operation(attempt); } catch (error) {
      lastError = error;
      if (attempt === attempts || (options.retryable && !options.retryable(error))) throw error;
      await new Promise((resolve) => setTimeout(resolve, baseDelayMs * 2 ** (attempt - 1)));
    }
  }
  throw lastError;
}

export function createIdempotencyKey(scope: string, resourceId: string, timestamp = Date.now()) {
  return `${scope}:${resourceId}:${timestamp.toString(36)}`.replace(/[^a-z0-9:._-]/giu, "-").slice(0, 160);
}

export type DeferredHubAction = { id: string; method: "POST" | "PUT" | "PATCH"; path: string; payload: Record<string, string>; queuedAt: string; attempts: number };
export function enqueueDeferredAction(queue: DeferredHubAction[], action: Omit<DeferredHubAction, "attempts" | "queuedAt">, maxSize = 100) {
  if (queue.some((item) => item.id === action.id)) return queue;
  return [...queue, { ...action, attempts: 0, queuedAt: new Date().toISOString() }].slice(-maxSize);
}
