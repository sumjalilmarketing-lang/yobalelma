import { performance } from "node:perf_hooks";

const samples = [];
const total = 100_000;
const started = performance.now();
for (let index = 0; index < total; index += 1) {
  const operationStarted = performance.now();
  const facts = { proofPresent: index % 7 !== 0, hubCapacity: index % 101, gpsAge: index % 30 };
  const triggered = !facts.proofPresent || facts.hubCapacity >= 90 || facts.gpsAge > 15;
  if (triggered && facts.hubCapacity > 100) throw new Error("unreachable");
  samples.push(performance.now() - operationStarted);
}
samples.sort((a, b) => a - b);
const percentile = (value) => samples[Math.min(samples.length - 1, Math.floor(samples.length * value))];
const elapsed = performance.now() - started;
console.log(JSON.stringify({
  benchmark: "operational-intelligence-rules",
  environment: "local-node-single-process",
  operations: total,
  p50Ms: percentile(.50),
  p75Ms: percentile(.75),
  p95Ms: percentile(.95),
  p99Ms: percentile(.99),
  throughputPerSecond: Math.round(total / elapsed * 1000),
  errorRate: 0,
  elapsedMs: Math.round(elapsed),
  limitation: "Microbenchmark local; not a production or Supabase load test.",
}, null, 2));
