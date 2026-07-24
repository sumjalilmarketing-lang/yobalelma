import nextEnv from "@next/env";
import { performance } from "node:perf_hooks";

nextEnv.loadEnvConfig(process.cwd(), false, { info: () => undefined, error: () => undefined });
const productionRef = "rgcgtcycbiuhcaoaadbh";
const projectRef = process.env.TRACEABILITY_STAGING_PROJECT_REF?.trim();
const shipmentId = process.env.TRACEABILITY_STAGING_SHIPMENT_ID?.trim();
const accessToken = process.env.SUPABASE_ACCESS_TOKEN?.trim();
const checkOnly = process.argv.includes("--check");
const errors = [];
if (!projectRef) errors.push("TRACEABILITY_STAGING_PROJECT_REF missing");
if (projectRef === productionRef) errors.push("production project explicitly forbidden");
if (!shipmentId || !/^[0-9a-f-]{36}$/i.test(shipmentId)) errors.push("TRACEABILITY_STAGING_SHIPMENT_ID missing or invalid");
if (!accessToken) errors.push("SUPABASE_ACCESS_TOKEN missing");
if (checkOnly || errors.length) {
  console.log(JSON.stringify({ ready: errors.length === 0, mode: "check-only", productionRefForbidden: productionRef, errors }, null, 2));
  process.exitCode = checkOnly ? 0 : 2;
} else {
  const concurrency = bounded(process.env.TRACEABILITY_LOAD_CONCURRENCY, 8, 1, 50);
  const requests = bounded(process.env.TRACEABILITY_LOAD_REQUESTS, 100, 1, 5000);
  const latencies = [];
  let failures = 0;
  let cursor = 0;
  const worker = async () => {
    while (cursor < requests) {
      const index = cursor++;
      const idempotency = `preprod-load-${Date.now()}-${index}`;
      const sql = `begin; select public.append_verified_operational_trace('${shipmentId}'::uuid,'proof_added',s.current_stage,s.current_custodian_type,s.current_custodian_id,s.current_location_id,'preprod_load','${idempotency}','load-test',now(),'unknown','{"scenario":"concurrent_scan"}'::jsonb,array[]::uuid[]) from public.parcel_custody_state s where s.shipment_id='${shipmentId}'::uuid; rollback;`;
      const started = performance.now();
      const response = await fetch(`https://api.supabase.com/v1/projects/${projectRef}/database/query`, { method: "POST", headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" }, body: JSON.stringify({ query: sql }) });
      latencies.push(performance.now() - started);
      if (!response.ok) failures += 1;
    }
  };
  const started = performance.now();
  await Promise.all(Array.from({ length: concurrency }, worker));
  const duration = performance.now() - started;
  latencies.sort((a, b) => a - b);
  const p = (ratio) => Number(latencies[Math.min(latencies.length - 1, Math.floor(latencies.length * ratio))].toFixed(2));
  console.log(JSON.stringify({ mode: "postgres-preprod-rollback", projectRef, requests, concurrency, failures, durationMs: Number(duration.toFixed(2)), throughputPerSecond: Number((requests / (duration / 1000)).toFixed(2)), latencyMs: { p50: p(.5), p75: p(.75), p95: p(.95), p99: p(.99) }, persistentTestData: false }, null, 2));
  if (failures) process.exitCode = 1;
}

function bounded(raw, fallback, minimum, maximum) { const parsed=Number.parseInt(raw ?? "",10);return Number.isFinite(parsed)?Math.min(maximum,Math.max(minimum,parsed)):fallback; }
