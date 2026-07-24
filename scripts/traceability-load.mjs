import { createHash, randomUUID } from "node:crypto";
import { performance } from "node:perf_hooks";

const count = Number.parseInt(process.env.TRACEABILITY_EVENT_COUNT ?? "100000", 10);
if (!Number.isInteger(count) || count < 1 || count > 1_000_000) throw new Error("TRACEABILITY_EVENT_COUNT must be between 1 and 1000000");
let previous = "0".repeat(64);
const latencies = [];
const started = performance.now();
for (let index = 1; index <= count; index += 1) {
  const itemStarted = performance.now();
  previous = createHash("sha256").update(`${randomUUID()}|parcel|${index}|parcel_in_transit|${previous}`).digest("hex");
  latencies.push(performance.now() - itemStarted);
}
const duration = performance.now() - started;
latencies.sort((a, b) => a - b);
const percentile = (value) => latencies[Math.min(latencies.length - 1, Math.floor(latencies.length * value))];
process.stdout.write(`${JSON.stringify({ workload: "local_hash_chain_only", events: count, durationMs: Number(duration.toFixed(2)), throughputPerSecond: Number((count / (duration / 1000)).toFixed(2)), latencyMs: { p50: Number(percentile(.5).toFixed(4)), p75: Number(percentile(.75).toFixed(4)), p95: Number(percentile(.95).toFixed(4)), p99: Number(percentile(.99).toFixed(4)) }, finalHash: previous, limitations: "No network, PostgreSQL, RLS, storage, concurrent scans or Control Tower workers." }, null, 2)}\n`);
