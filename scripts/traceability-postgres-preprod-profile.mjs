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
if (!shipmentId || !/^[0-9a-f-]{36}$/iu.test(shipmentId)) errors.push("TRACEABILITY_STAGING_SHIPMENT_ID missing or invalid");
if (!accessToken) errors.push("SUPABASE_ACCESS_TOKEN missing");

if (checkOnly || errors.length) {
  console.log(JSON.stringify({ ready: errors.length === 0, mode: "check-only", productionRefForbidden: productionRef, errors }, null, 2));
  process.exitCode = checkOnly ? 0 : 2;
} else {
  const runs = bounded(process.env.TRACEABILITY_PROFILE_RUNS, 30, 5, 200);
  const scenarios = [
    ["passport_read", `select sequence_no,event_type,stage_before,stage_after,occurred_at,event_hash from public.parcel_traceability_events where shipment_id='${shipmentId}'::uuid order by sequence_no`],
    ["proof_read", `select proof_type,captured_at,verification_status,latitude,longitude from public.parcel_traceability_proofs where shipment_id='${shipmentId}'::uuid order by captured_at`],
    ["tracking_search", `select id,tracking_code,status from public.shipments where id='${shipmentId}'::uuid or tracking_code=(select tracking_code from public.shipments where id='${shipmentId}'::uuid)`],
    ["custody_read", `select current_stage,current_custodian_type,current_custodian_id,current_location_id,event_count from public.parcel_custody_state where shipment_id='${shipmentId}'::uuid`],
  ];
  const baseline = await databaseStats();
  const results = [];
  for (const [name, sql] of scenarios) {
    const latencies = [];
    let resultBytes = 0;
    let failures = 0;
    for (let index = 0; index < runs; index += 1) {
      const started = performance.now();
      try {
        const body = await query(sql);
        resultBytes += Buffer.byteLength(JSON.stringify(body));
      } catch {
        failures += 1;
      }
      latencies.push(performance.now() - started);
    }
    latencies.sort((a, b) => a - b);
    results.push({
      scenario: name,
      runs,
      failures,
      errorRate: failures / runs,
      throughputPerSecond: Number((runs / (latencies.reduce((sum, value) => sum + value, 0) / 1000)).toFixed(2)),
      resultBytesAverage: Math.round(resultBytes / Math.max(1, runs - failures)),
      latencyMs: { p50: percentile(latencies,.5), p75: percentile(latencies,.75), p95: percentile(latencies,.95), p99: percentile(latencies,.99) },
      explainAnalyze: await query(`explain (analyze,buffers,format json) ${sql}`),
    });
  }
  const after = await databaseStats();
  console.log(JSON.stringify({
    mode: "authorized-preproduction-read-profile",
    projectRef,
    shipmentId,
    results,
    database: { before: baseline, after },
    unavailableFromSqlApi: ["host CPU", "host memory"],
    persistentTestData: false,
  }, null, 2));
  if (results.some((result) => result.failures > 0)) process.exitCode = 1;
}

async function databaseStats() {
  const core = await query(`select
    (select count(*) from pg_stat_activity where datname=current_database()) connections,
    (select count(*) from pg_locks where not granted) waiting_locks,
    (select deadlocks from pg_stat_database where datname=current_database()) deadlocks;`);
  const extension = await query(`select namespace.nspname schema_name from pg_extension extension join pg_namespace namespace on namespace.oid=extension.extnamespace where extension.extname='pg_stat_statements';`);
  const schema = extension[0]?.schema_name;
  const slowQueries = typeof schema === "string" && /^[a-z_][a-z0-9_]*$/iu.test(schema)
    ? await query(`select calls,round(total_exec_time::numeric,2) total_exec_time_ms,round(mean_exec_time::numeric,2) mean_exec_time_ms,left(regexp_replace(query,'[[:space:]]+',' ','g'),180) query from ${schema}.pg_stat_statements order by total_exec_time desc limit 10;`)
    : [];
  return { ...core[0], slowQueries };
}

async function query(sql) {
  const response = await fetch(`https://api.supabase.com/v1/projects/${projectRef}/database/query`, {
    method: "POST",
    headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
    body: JSON.stringify({ query: sql }),
  });
  const body = await response.json();
  if (!response.ok) throw new Error(JSON.stringify(body).replaceAll(accessToken, "[redacted]"));
  return body;
}

function percentile(values, ratio) {
  return Number(values[Math.min(values.length - 1, Math.floor(values.length * ratio))].toFixed(2));
}

function bounded(raw, fallback, minimum, maximum) {
  const parsed = Number.parseInt(raw ?? "",10);
  return Number.isFinite(parsed) ? Math.min(maximum,Math.max(minimum,parsed)) : fallback;
}
