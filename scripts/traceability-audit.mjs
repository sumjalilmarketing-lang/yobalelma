import nextEnv from "@next/env";
const { loadEnvConfig } = nextEnv;
const PROJECT_REF = "rgcgtcycbiuhcaoaadbh";

function redact(text) { return text.replace(/sbp_[A-Za-z0-9_-]+/g, "sbp_[redacted]").replace(/eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/g, "jwt_[redacted]"); }
async function query(sql) {
  const response = await fetch(`https://api.supabase.com/v1/projects/${PROJECT_REF}/database/query`, { method: "POST", headers: { Authorization: `Bearer ${process.env.SUPABASE_ACCESS_TOKEN}`, "Content-Type": "application/json" }, body: JSON.stringify({ query: sql }) });
  const body = await response.json();
  if (!response.ok) throw new Error(redact(JSON.stringify(body)));
  return body;
}

loadEnvConfig(process.cwd(), false, { info: () => undefined, error: () => undefined });
if (!process.env.SUPABASE_ACCESS_TOKEN) throw new Error("Missing SUPABASE_ACCESS_TOKEN");

const [counts, integrity, protections, consistency] = await Promise.all([
  query(`select
    (select count(*) from parcel_traceability_events)::int event_count,
    (select count(*) from parcel_custody_state)::int custody_count,
    (select count(*) from parcel_traceability_proofs)::int proof_count,
    (select count(*) from parcel_traceability_anomalies where status in ('open','assigned','investigating'))::int active_anomalies,
    (select count(*) from shipment_packages)::int parcel_count;`),
  query(`with ordered as (
    select parcel_id,sequence_no,event_type,stage_after,previous_event_hash,event_hash,
      lag(event_hash) over(partition by parcel_id order by sequence_no) expected_previous,
      row_number() over(partition by parcel_id order by sequence_no) expected_sequence
    from parcel_traceability_events
  ) select
    count(*) filter(where sequence_no<>expected_sequence)::int sequence_gaps,
    count(*) filter(where sequence_no>1 and previous_event_hash is distinct from expected_previous)::int broken_hash_links,
    (select count(*) from shipment_packages p left join parcel_custody_state c on c.parcel_id=p.id where c.parcel_id is null)::int parcels_without_custodian,
    (select count(*) from (select parcel_id from parcel_traceability_events where event_type in ('parcel_delivered','parcel_collected_by_recipient') and validation_status='confirmed' group by parcel_id having count(*)>1) d)::int duplicate_deliveries,
    (select count(*) from parcel_custody_state where current_custodian_id is null)::int states_without_custodian
  from ordered;`),
  query(`select
    exists(select 1 from pg_trigger where tgname='parcel_traceability_events_immutable' and tgenabled<>'D') immutable_event_trigger,
    exists(select 1 from pg_trigger where tgname='delivery_proofs_import_traceability' and tgenabled<>'D') proof_bridge_trigger,
    exists(select 1 from pg_trigger where tgname='shipment_status_event_guard' and tgenabled<>'D') status_guard_trigger,
    exists(select 1 from pg_trigger where tgname='delivery_event_traceability' and tgenabled<>'D') delivery_bridge_trigger,
    exists(select 1 from pg_trigger where tgname='customs_event_traceability' and tgenabled<>'D') customs_bridge_trigger,
    exists(select 1 from pg_proc where proname='record_parcel_traceability_event' and prosecdef) event_rpc_security_definer,
    exists(select 1 from pg_proc where proname='register_parcel_traceability_proof' and prosecdef) proof_rpc_security_definer;`),
  query(`select public.run_parcel_traceability_consistency_audit() audit;`),
]);

const result = { projectRef: PROJECT_REF, checkedAt: new Date().toISOString(), counts: counts[0], integrity: integrity[0], consistency: consistency[0]?.audit ?? {}, protections: protections[0] };
const failures = Object.entries(result.integrity).filter(([, value]) => Number(value) !== 0);
for (const [name, value] of Object.entries(result.consistency)) if (Number(value) !== 0) failures.push([name, value]);
if (!Object.values(result.protections).every(Boolean)) failures.push(["missing_protection", true]);
console.log(JSON.stringify({ ...result, ok: failures.length === 0, failures }, null, 2));
if (failures.length) process.exitCode = 1;
