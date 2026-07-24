import nextEnv from "@next/env";

nextEnv.loadEnvConfig(process.cwd(), false, { info: () => undefined, error: () => undefined });
const productionRef = "rgcgtcycbiuhcaoaadbh";
const projectRef = process.env.TRACEABILITY_STAGING_PROJECT_REF?.trim();
const accessToken = process.env.SUPABASE_ACCESS_TOKEN?.trim();
const shipmentIds = (process.env.TRACEABILITY_RECIPE_SHIPMENT_IDS ?? "").split(",").map((value) => value.trim()).filter(Boolean);
const checkOnly = process.argv.includes("--check");
const errors = [];
if (!projectRef) errors.push("TRACEABILITY_STAGING_PROJECT_REF missing");
if (projectRef === productionRef) errors.push("production project explicitly forbidden");
if (!accessToken) errors.push("SUPABASE_ACCESS_TOKEN missing");
if (!shipmentIds.length || shipmentIds.some((value) => !/^[0-9a-f-]{36}$/iu.test(value))) errors.push("TRACEABILITY_RECIPE_SHIPMENT_IDS missing or invalid");

if (checkOnly || errors.length) {
  console.log(JSON.stringify({ ready: errors.length === 0, mode: "check-only", productionRefForbidden: productionRef, shipmentCount: shipmentIds.length, errors }, null, 2));
  process.exitCode = checkOnly ? 0 : 2;
} else {
  const ids = shipmentIds.map((id) => `'${id}'::uuid`).join(",");
  const result = await query(`
    with selected as (select unnest(array[${ids}]) shipment_id),
    parcels as (
      select package.id parcel_id,package.shipment_id,state.event_count,state.last_event_id,state.last_event_hash,state.current_custodian_id
      from selected join public.shipment_packages package using(shipment_id)
      left join public.parcel_custody_state state on state.parcel_id=package.id
    ),
    ordered as (
      select event.*,lag(event.event_hash) over(partition by event.parcel_id order by event.sequence_no) expected_previous
      from public.parcel_traceability_events event join parcels using(parcel_id)
    ),
    event_checks as (
      select parcel_id,count(*) event_rows,max(sequence_no) maximum_sequence,
        count(*) filter(where sequence_no>1 and previous_event_hash is distinct from expected_previous) broken_hash_links,
        count(*) filter(where event_type in ('parcel_delivered','parcel_collected_by_recipient') and validation_status='confirmed') deliveries,
        count(*) filter(where event_type in ('custody_transfer_confirmed','parcel_handed_to_traveler','parcel_delivered','parcel_collected_by_recipient')) sensitive_events
      from ordered group by parcel_id
    )
    select parcels.shipment_id,parcels.parcel_id,
      coalesce(event_checks.event_rows,0) event_count,
      coalesce(event_checks.maximum_sequence,0)=coalesce(event_checks.event_rows,0) sequence_complete,
      coalesce(event_checks.broken_hash_links,0)=0 hash_chain_complete,
      parcels.current_custodian_id is not null single_current_custodian,
      coalesce(event_checks.deliveries,0)<=1 no_duplicate_delivery,
      (select count(*) from public.parcel_traceability_proofs proof where proof.parcel_id=parcels.parcel_id) proof_count,
      exists(select 1 from public.parcel_traceability_proofs proof where proof.parcel_id=parcels.parcel_id and proof.proof_type in ('otp','signature','delivery') and proof.verification_status='verified') final_proof_present,
      (select count(*) from public.parcel_custody_transfer_requests transfer where transfer.parcel_id=parcels.parcel_id and transfer.status='confirmed' and transfer.finalized_event_id is not null)>=coalesce(event_checks.sensitive_events,0) dual_validations_complete,
      coalesce(event_checks.event_rows,0)=coalesce(parcels.event_count,0) passport_consistent,
      exists(select 1 from public.control_tower_events tower where tower.source_module='parcel_traceability' and tower.entity_id=parcels.shipment_id::text) control_tower_present,
      exists(select 1 from public.digital_twin_entities twin where twin.entity_type='shipment' and twin.entity_id=parcels.shipment_id::text) digital_twin_present,
      exists(select 1 from public.control_tower_notification_commands notification join public.control_tower_events tower on tower.id=notification.event_id where tower.entity_id=parcels.shipment_id::text) notification_present,
      exists(select 1 from public.parcel_passport_access_log access_log where access_log.parcel_id=parcels.parcel_id and access_log.access_type='export') pdf_export_logged
    from parcels left join event_checks using(parcel_id)
    order by parcels.shipment_id;
  `);
  const checks = ["sequence_complete","hash_chain_complete","single_current_custodian","no_duplicate_delivery","final_proof_present","dual_validations_complete","passport_consistent","control_tower_present","digital_twin_present","notification_present","pdf_export_logged"];
  const failures = result.flatMap((row) => [
    ...(Number(row.proof_count) > 0 ? [] : ["proof_count"]),
    ...checks.filter((check) => row[check] !== true),
  ].map((check) => ({ shipmentId: row.shipment_id, check })));
  console.log(JSON.stringify({ ok: failures.length === 0, projectRef, checkedAt: new Date().toISOString(), shipments: result, failures }, null, 2));
  if (failures.length) process.exitCode = 1;
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
