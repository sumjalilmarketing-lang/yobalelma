const forbiddenProductionHosts = new Set(["yobalelma-user.vercel.app", "yobalelma-hub.vercel.app", "yobalelma-relay.vercel.app", "yobalelma-collection.vercel.app", "yobalelma-admin.vercel.app", "rgcgtcycbiuhcaoaadbh.supabase.co"]);
export function validateLoadTarget(rawUrl, targetClass) {
  const url = new URL(rawUrl);
  if (forbiddenProductionHosts.has(url.hostname)) throw new Error("PRODUCTION_LOAD_TARGET_REFUSED");
  if (targetClass !== "disposable-staging") throw new Error("DISPOSABLE_STAGING_CONFIRMATION_REQUIRED");
  if (url.protocol !== "https:" && !["localhost", "127.0.0.1"].includes(url.hostname)) throw new Error("INSECURE_LOAD_TARGET_REFUSED");
  return url.origin;
}
export function validateScenario(scenario) {
  if (!scenario || !Array.isArray(scenario.steps) || !scenario.steps.length) throw new Error("INVALID_LOAD_SCENARIO");
  return { ...scenario, steps: scenario.steps.map((step) => {
    if (!/^\/[A-Za-z0-9/_?&=.-]*$/u.test(step.path) || step.path.startsWith("//")) throw new Error("INVALID_LOAD_PATH");
    if (!["GET", "POST", "PATCH"].includes(step.method)) throw new Error("INVALID_LOAD_METHOD");
    return { expectedStatus: 200, ...step };
  }) };
}
export function percentile(values, ratio) { if (!values.length) return 0; return values[Math.min(values.length - 1, Math.max(0, Math.ceil(values.length * ratio) - 1))]; }
export async function runCriticalLoad({ baseUrl, concurrency, iterations, scenario, authorization, runId = crypto.randomUUID() }) {
  const checked = validateScenario(scenario); const durations = []; const failures = []; let cursor = 0; const startedAt = performance.now();
  await Promise.all(Array.from({ length: concurrency }, async () => { while (cursor < iterations) { const iteration = cursor++; for (const step of checked.steps) { const started = performance.now(); try {
    const replacements = (value) => value.replaceAll("{{iteration}}", String(iteration)).replaceAll("{{runId}}", runId);
    const response = await fetch(`${baseUrl}${replacements(step.path)}`, { method: step.method, headers: { "content-type": "application/json", "x-yobalelma-load-run": runId, ...(authorization ? { authorization } : {}) }, body: step.body ? replacements(JSON.stringify(step.body)) : undefined, redirect: "error", signal: AbortSignal.timeout(step.timeoutMs ?? 10_000) });
    if (response.status !== step.expectedStatus) failures.push({ step: step.name, status: response.status }); await response.arrayBuffer();
  } catch (error) { failures.push({ step: step.name, error: error instanceof Error ? error.name : "UnknownError" }); } finally { durations.push(Math.round(performance.now() - started)); } } } }));
  durations.sort((a, b) => a - b);
  return { runId, iterations, concurrency, requests: durations.length, failures: failures.length, errorRate: failures.length / Math.max(1, durations.length), durationMs: Math.round(performance.now() - startedAt), p50Ms: percentile(durations, .5), p95Ms: percentile(durations, .95), p99Ms: percentile(durations, .99) };
}
