const targets = [
  ["user", "https://yobalelma-user.vercel.app/api/health"],
  ["hub", "https://yobalelma-hub.vercel.app/api/health"],
  ["relay", "https://yobalelma-relay.vercel.app/api/health"],
  ["collection", "https://yobalelma-collection.vercel.app/api/health"],
  ["admin", "https://yobalelma-admin.vercel.app/api/health"],
];
const concurrency = boundedInteger(process.env.LOAD_CONCURRENCY, 10, 1, 50);
const requestsPerTarget = boundedInteger(process.env.LOAD_REQUESTS_PER_TARGET, 50, 1, 500);
const maximumErrorRate = 0.01;
const maximumP95Ms = 3_000;

const reports = [];
for (const [application, url] of targets) {
  const durations = [];
  let failures = 0;
  let next = 0;
  await Promise.all(Array.from({ length: concurrency }, async () => {
    while (next < requestsPerTarget) {
      next += 1;
      const started = performance.now();
      try {
        const response = await fetch(url, { cache: "no-store", headers: { "user-agent": "Yobalelma-Controlled-Load/1.0" }, signal: AbortSignal.timeout(8_000) });
        const body = await response.json().catch(() => null);
        if (response.status !== 200 || body?.status !== "ok") failures += 1;
      } catch {
        failures += 1;
      } finally {
        durations.push(Math.round(performance.now() - started));
      }
    }
  }));
  durations.sort((a, b) => a - b);
  const errorRate = failures / durations.length;
  const p95Ms = percentile(durations, 0.95);
  reports.push({ application, requests: durations.length, concurrency, failures, errorRate, p50Ms: percentile(durations, 0.5), p95Ms, p99Ms: percentile(durations, 0.99), passed: errorRate <= maximumErrorRate && p95Ms <= maximumP95Ms });
}

const result = { executedAt: new Date().toISOString(), scope: "controlled-health-only", thresholds: { maximumErrorRate, maximumP95Ms }, reports };
console.log(JSON.stringify(result));
if (reports.some((report) => !report.passed)) process.exitCode = 1;

function percentile(values, ratio) { return values[Math.min(values.length - 1, Math.ceil(values.length * ratio) - 1)] ?? 0; }
function boundedInteger(raw, fallback, minimum, maximum) {
  const value = raw ? Number(raw) : fallback;
  if (!Number.isInteger(value) || value < minimum || value > maximum) throw new Error(`Load parameter must be between ${minimum} and ${maximum}.`);
  return value;
}
