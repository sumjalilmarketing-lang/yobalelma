const required = ["DR_SOURCE_URL", "DR_SOURCE_SERVICE_KEY", "DR_TARGET_URL", "DR_TARGET_SERVICE_KEY"];
for (const name of required) if (!process.env[name]) throw new Error(`Missing ${name}.`);

const source = new URL(process.env.DR_SOURCE_URL);
const target = new URL(process.env.DR_TARGET_URL);
if (source.origin === target.origin) throw new Error("The disaster-recovery target must be isolated from production.");
if (source.origin !== "https://rgcgtcycbiuhcaoaadbh.supabase.co") throw new Error("Unexpected Yobalelma source project.");

const tables = [
  "profiles", "role_assignments", "user_roles", "shipments", "shipment_packages",
  "trips", "relay_inventory", "collection_routes", "collection_route_stops",
  "hub_inventory", "hub_batches", "payment_intents", "identity_verifications",
  "audit_log_events", "operational_incidents",
];

const startedAt = Date.now();
const comparisons = [];
for (const table of tables) {
  const [sourceCount, targetCount] = await Promise.all([
    count(source.origin, process.env.DR_SOURCE_SERVICE_KEY, table),
    count(target.origin, process.env.DR_TARGET_SERVICE_KEY, table),
  ]);
  comparisons.push({ matches: sourceCount === targetCount, sourceCount, table, targetCount });
}

const report = {
  completedAt: new Date().toISOString(),
  durationMs: Date.now() - startedAt,
  integrityPassed: comparisons.every((item) => item.matches),
  comparisons,
};
console.log(JSON.stringify(report));
if (!report.integrityPassed) process.exitCode = 1;

async function count(origin, key, table) {
  const response = await fetch(`${origin}/rest/v1/${table}?select=id`, {
    headers: { apikey: key, Authorization: `Bearer ${key}`, Prefer: "count=exact", Range: "0-0" },
    signal: AbortSignal.timeout(10_000),
  });
  if (!response.ok) throw new Error(`Integrity query failed for ${table} (${response.status}).`);
  const range = response.headers.get("content-range");
  const value = range?.split("/").at(-1);
  if (!value || value === "*") throw new Error(`Exact count unavailable for ${table}.`);
  return Number(value);
}
