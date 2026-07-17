import { performance } from "node:perf_hooks";

const baseUrl = process.env.HUB_LOAD_BASE_URL ?? "http://127.0.0.1:43124";
const virtualAgents = Number(process.env.HUB_LOAD_AGENTS ?? 100);
const requestCount = Number(process.env.HUB_LOAD_REQUESTS ?? 300);

async function signIn() {
  const response = await fetch(`${baseUrl}/api/auth/hub-sign-in`, { method: "POST", redirect: "manual", headers: { "content-type": "application/x-www-form-urlencoded" }, body: new URLSearchParams({ email: "agent.hub@yobalelma.test", role: "hub_agent", code: "HUB-AGENT", returnTo: "/hub" }) });
  const cookie = response.headers.get("set-cookie")?.split(";")[0];
  if (!cookie) throw new Error(`Load sign-in failed (${response.status})`);
  return cookie;
}

async function runPool(cookie) {
  const durations = [];
  let failures = 0;
  let cursor = 0;
  async function worker() { while (cursor < requestCount) { const index = cursor++; const started = performance.now(); try { const target = index % 3 === 0 ? "/api/hub/search?q=DSS" : index % 3 === 1 ? "/hub/stock-monitoring" : "/hub/alerts"; const response = await fetch(`${baseUrl}${target}`, { headers: { cookie } }); if (!response.ok) failures += 1; await response.arrayBuffer(); } catch { failures += 1; } durations.push(performance.now() - started); } }
  await Promise.all(Array.from({ length: virtualAgents }, worker));
  return { durations, failures };
}

function packageBenchmark(size) { const packages = Array.from({ length: size }, (_, index) => ({ id: `pkg-${index}`, tracking: `YBL-${String(index).padStart(8, "0")}`, hub: index % 3, weight: 1 + index % 20, status: index % 17 === 0 ? "quarantine" : "stock" })); const started = performance.now(); const result = packages.filter((item) => item.status === "stock" && item.hub === 0).sort((a, b) => b.weight - a.weight); return { size, resultCount: result.length, durationMs: performance.now() - started, heapMb: process.memoryUsage().heapUsed / 1024 / 1024 }; }

const cookie = await signIn();
const started = performance.now();
const { durations, failures } = await runPool(cookie);
durations.sort((a, b) => a - b);
const percentile = (value) => durations[Math.min(durations.length - 1, Math.floor(durations.length * value))];
console.log(JSON.stringify({ baseUrl, virtualAgents, requests: requestCount, failures, failureRate: failures / requestCount, durationMs: performance.now() - started, latencyMs: { p50: percentile(0.5), p95: percentile(0.95), p99: percentile(0.99), max: durations.at(-1) }, packageBenchmarks: [packageBenchmark(1000), packageBenchmark(10000)], thresholds: { failureRate: "<1%", p95: "<1500ms", searchP95: "<750ms" } }, null, 2));
