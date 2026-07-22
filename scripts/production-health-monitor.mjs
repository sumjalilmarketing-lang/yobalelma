const targets = [
  ["user", "https://yobalelma-user.vercel.app/api/health"],
  ["hub", "https://yobalelma-hub.vercel.app/api/health"],
  ["relay", "https://yobalelma-relay.vercel.app/api/health"],
  ["collection", "https://yobalelma-collection.vercel.app/api/health"],
  ["admin", "https://yobalelma-admin.vercel.app/api/health"],
];

const simulateFailure = process.argv.includes("--simulate-failure");
const results = await Promise.all(targets.map(async ([application, url]) => {
  const startedAt = performance.now();
  try {
    const response = await fetch(url, {
      headers: { "user-agent": "Yobalelma-Production-Monitor/1.0" },
      redirect: "error",
      signal: AbortSignal.timeout(5_000),
    });
    const durationMs = Math.round(performance.now() - startedAt);
    const body = await response.json().catch(() => null);
    const validBody = body && Object.keys(body).length === 1 && body.status === "ok";
    return { application, durationMs, healthy: response.status === 200 && validBody && durationMs <= 3_000, status: response.status };
  } catch (error) {
    return { application, durationMs: Math.round(performance.now() - startedAt), healthy: false, status: 0, error: error instanceof Error ? error.name : "UnknownError" };
  }
}));

if (simulateFailure) results.push({ application: "injected-incident", durationMs: 0, healthy: false, status: 503 });

const report = { checkedAt: new Date().toISOString(), results };
console.log(JSON.stringify(report));
if (results.some((result) => !result.healthy)) process.exitCode = 1;
