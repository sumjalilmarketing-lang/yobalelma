import nextEnv from "@next/env";

const { loadEnvConfig } = nextEnv;

const PROJECT_REF = "rgcgtcycbiuhcaoaadbh";
const MANAGEMENT_QUERY_URL = `https://api.supabase.com/v1/projects/${PROJECT_REF}/database/query`;

const TABLES = [
  "parcel_traceability_events",
  "parcel_custody_state",
  "parcel_traceability_proofs",
  "parcel_proof_requirements",
  "parcel_seals",
  "parcel_traceability_anomalies",
  "parcel_passport_access_log",
  "parcel_custody_transfer_requests",
  "airport_hubs",
  "hub_agent_profiles",
  "operations_profiles",
  "roles",
  "permissions",
  "role_permissions",
  "user_roles",
  "hub_zones",
  "hub_aisles",
  "hub_shelves",
  "hub_storage_locations",
  "hub_inventory",
  "hub_inventory_movements",
  "hub_inbound_receipts",
  "hub_inbound_receipt_items",
  "hub_inspections",
  "operational_incidents",
  "hub_batch_shipments",
  "batch_documents",
  "batch_events",
  "hub_handover_events",
  "hub_countries",
  "hub_timezones",
  "hub_operating_hours",
  "hub_capacities",
  "hub_settings",
  "hub_statuses",
  "hub_staff_assignments",
  "hub_agent_shifts",
  "hub_agent_tasks",
  "hub_agent_activity_logs",
  "hub_agent_performance",
  "hub_audit_events",
  "hub_security_events",
  "hub_user_activity_events",
  "hub_saved_views",
  "hub_search_history",
  "hub_alerts",
  "hub_incident_comments",
  "hub_incident_attachments",
  "hub_incident_postmortems",
  "hub_forecast_snapshots",
  "hub_export_jobs",
  "hub_system_metrics",
  "system_settings",
  "feature_flags",
  "final_delivery_orders",
  "destination_package_checks",
  "delivery_otps",
  "otp_attempts",
  "otp_events",
  "proof_of_delivery",
  "proof_of_delivery_summaries",
  "delivery_signatures",
  "delivery_photos",
  "delivery_events",
  "notification_templates",
  "notification_events",
  "notification_deliveries",
  "user_notification_preferences",
  "payout_release_events",
  "manual_corrections",
  "payments",
  "payment_events",
  "refunds",
  "ledger_entries",
  "partner_location_sync_runs",
  "secure_uploads",
  "secure_upload_scan_events",
  "customs_brokers",
  "customs_broker_agents",
  "customs_offices",
  "customs_cases",
  "customs_items",
  "customs_documents",
  "customs_events",
  "customs_decisions",
  "customs_duties",
  "customs_rule_sets",
  "customs_hs_suggestions",
  "customs_outbox",
  "operational_location_consents",
  "operational_position_events",
  "driver_operational_states",
  "driver_status_events",
  "operational_live_positions",
  "operational_geofences",
  "operational_geofence_events",
  "operational_tracking_alerts",
  "operational_location_access_logs",
  "dispatch_rule_sets",
  "dispatch_recommendations",
  "dispatch_events",
  "dispatch_recommendation_events",
  "control_tower_events",
  "control_tower_outbox",
  "digital_twin_entities",
  "digital_twin_state_events",
  "control_tower_snapshots",
  "control_tower_recommendations",
  "control_tower_decision_events",
  "control_tower_module_health",
  "control_tower_notification_commands",
  "operational_incident_comments",
];

const FUNCTIONS = [
  "current_user_can_access_hub",
  "get_numeric_system_setting",
  "move_hub_inventory",
  "receive_hub_manifest",
  "record_hub_inspection",
  "reserve_hub_batch_capacity_v2",
  "create_hub_incident",
  "record_hub_handover_event",
  "confirm_destination_batch_reception",
  "generate_delivery_otp",
  "verify_delivery_otp",
  "revoke_delivery_otp",
  "set_final_delivery_choice",
  "create_final_mile_delivery_mission",
  "record_final_delivery_attempt",
  "create_manual_correction",
  "admin_manual_delivery_override",
  "scan_handover_qr_token",
  "current_user_can_manage_hub",
  "get_hub_control_tower",
  "search_hub_enterprise",
  "apply_verified_payment_event",
  "prevent_ledger_mutation",
  "claim_secure_upload_scan",
  "complete_secure_upload_scan",
  "claim_notification_delivery",
  "complete_notification_delivery",
  "create_customs_case",
  "current_user_has_customs_country",
  "verify_customs_document",
  "record_manual_customs_decision",
  "approve_manual_customs_decision",
  "shipment_has_verified_customs_release",
  "apply_verified_customs_event",
  "assign_customs_broker",
  "approve_customs_rule_set",
  "validate_customs_hs_suggestion",
  "record_indicative_customs_duty",
  "apply_verified_customs_duty",
  "apply_verified_customs_duty_payment",
  "claim_customs_outbox",
  "complete_customs_outbox",
  "record_operational_position",
  "set_operational_location_consent",
  "approve_dispatch_rule_set",
  "replace_dispatch_recommendations",
  "approve_dispatch_recommendation",
  "purge_expired_operational_positions",
  "current_user_can_view_tracking_subject",
  "set_driver_operational_status",
  "record_operational_positions_batch",
  "purge_expired_operational_tracking",
  "get_client_mission_tracking",
  "manage_tracking_alert",
  "run_tracking_alert_sweep",
  "record_verified_geofence_event",
  "current_user_has_control_tower_country",
  "ingest_control_tower_events",
  "claim_control_tower_outbox",
  "decide_control_tower_recommendation",
  "purge_control_tower_history",
  "apply_control_tower_digital_twin",
  "refresh_control_tower_snapshot",
  "generate_control_tower_recommendations",
  "complete_control_tower_outbox",
  "process_control_tower_outbox_item",
  "manage_control_tower_incident",
  "emit_control_tower_domain_event",
  "sanitize_control_tower_event_payload",
  "record_parcel_traceability_event",
  "register_parcel_traceability_proof",
  "is_valid_parcel_stage_transition",
  "traceability_country_code",
  "append_verified_operational_trace",
  "log_parcel_passport_access",
  "add_collection_manifest_item_traced",
  "record_relay_storage_traced",
  "record_parcel_seal_action",
  "run_parcel_traceability_consistency_audit",
  "request_parcel_custody_transfer",
  "decide_parcel_custody_transfer",
  "record_parcel_traceability_event_internal",
  "assert_verified_traceability_proofs",
  "assert_dual_transfer_proofs",
  "traceability_distance_meters",
];
const SERVICE_ONLY_FUNCTIONS = ["claim_secure_upload_scan", "complete_secure_upload_scan", "claim_notification_delivery", "complete_notification_delivery", "apply_verified_customs_event", "apply_verified_customs_duty", "apply_verified_customs_duty_payment", "claim_customs_outbox", "complete_customs_outbox", "replace_dispatch_recommendations", "purge_expired_operational_positions", "purge_expired_operational_tracking", "run_tracking_alert_sweep", "record_verified_geofence_event", "ingest_control_tower_events", "claim_control_tower_outbox", "purge_control_tower_history", "apply_control_tower_digital_twin", "refresh_control_tower_snapshot", "generate_control_tower_recommendations", "complete_control_tower_outbox", "process_control_tower_outbox_item", "run_parcel_traceability_consistency_audit"];
const AUTHENTICATED_ONLY_FUNCTIONS = ["record_parcel_traceability_event", "register_parcel_traceability_proof", "log_parcel_passport_access", "add_collection_manifest_item_traced", "record_relay_storage_traced", "record_parcel_seal_action", "request_parcel_custody_transfer", "decide_parcel_custody_transfer"];
const INTERNAL_ONLY_FUNCTIONS = ["append_verified_operational_trace", "record_parcel_traceability_event_internal", "assert_verified_traceability_proofs", "assert_dual_transfer_proofs"];

function redact(text) {
  return text
    .replace(/sbp_[A-Za-z0-9_-]+/g, "sbp_[redacted]")
    .replace(/eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/g, "jwt_[redacted]");
}

function literalList(values) {
  return values.map((value) => `'${value.replaceAll("'", "''")}'`).join(", ");
}

async function runQuery(query) {
  const response = await fetch(MANAGEMENT_QUERY_URL, {
    body: JSON.stringify({ query }),
    headers: {
      Authorization: `Bearer ${process.env.SUPABASE_ACCESS_TOKEN}`,
      "Content-Type": "application/json",
    },
    method: "POST",
  });

  const body = await response.json();

  if (!response.ok) {
    throw new Error(redact(JSON.stringify(body)));
  }

  return body;
}

async function main() {
  loadEnvConfig(process.cwd(), false, { info: () => undefined, error: () => undefined });

  if (!process.env.SUPABASE_ACCESS_TOKEN) {
    throw new Error("Missing SUPABASE_ACCESS_TOKEN.");
  }

  const rls = await runQuery(`
    select
      c.relname as table_name,
      c.relrowsecurity as rls_enabled,
      count(p.polname)::int as policy_count
    from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    left join pg_policy p on p.polrelid = c.oid
    where n.nspname = 'public'
      and c.relkind in ('r', 'p')
      and c.relname in (${literalList(TABLES)})
    group by c.relname, c.relrowsecurity
    order by c.relname;
  `);

  const functions = await runQuery(`
    select proname as function_name, count(*)::int as overloads
    from pg_proc
    join pg_namespace on pg_namespace.oid = pg_proc.pronamespace
    where pg_namespace.nspname = 'public'
      and proname in (${literalList(FUNCTIONS)})
    group by proname
    order by proname;
  `);
  const serviceOnlyFunctions = await runQuery(`
    select p.proname as function_name, p.prosecdef as security_definer, coalesce(p.proacl::text, '') as acl,
      has_function_privilege('service_role', p.oid, 'EXECUTE') as service_role_execute,
      has_function_privilege('authenticated', p.oid, 'EXECUTE') as authenticated_execute,
      has_function_privilege('anon', p.oid, 'EXECUTE') as anon_execute
    from pg_proc p join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and p.proname in (${literalList(SERVICE_ONLY_FUNCTIONS)})
    order by p.proname;
  `);
  const authenticatedOnlyFunctions = await runQuery(`
    select p.proname as function_name, p.prosecdef as security_definer,
      has_function_privilege('authenticated', p.oid, 'EXECUTE') as authenticated_execute,
      has_function_privilege('anon', p.oid, 'EXECUTE') as anon_execute
    from pg_proc p join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and p.proname in (${literalList(AUTHENTICATED_ONLY_FUNCTIONS)})
    order by p.proname;
  `);
  const internalOnlyFunctions = await runQuery(`
    select p.proname as function_name, p.prosecdef as security_definer,
      has_function_privilege('service_role', p.oid, 'EXECUTE') as service_role_execute,
      has_function_privilege('authenticated', p.oid, 'EXECUTE') as authenticated_execute,
      has_function_privilege('anon', p.oid, 'EXECUTE') as anon_execute
    from pg_proc p join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and p.proname in (${literalList(INTERNAL_ONLY_FUNCTIONS)})
    order by p.proname;
  `);

  const missingRls = TABLES.filter((table) => !rls.some((row) => row.table_name === table && row.rls_enabled));
  const missingPolicies = rls.filter((row) => row.policy_count === 0).map((row) => row.table_name);
  const missingFunctions = FUNCTIONS.filter(
    (fn) => !functions.some((row) => row.function_name === fn),
  );
  const unsafeServiceFunctions = SERVICE_ONLY_FUNCTIONS.filter((name) => !serviceOnlyFunctions.some((fn) => fn.function_name === name && fn.security_definer && fn.service_role_execute && !fn.authenticated_execute && !fn.anon_execute));
  const unsafeAuthenticatedFunctions = AUTHENTICATED_ONLY_FUNCTIONS.filter((name) => !authenticatedOnlyFunctions.some((fn) => fn.function_name === name && fn.security_definer && fn.authenticated_execute && !fn.anon_execute));
  const unsafeInternalFunctions = INTERNAL_ONLY_FUNCTIONS.filter((name) => !internalOnlyFunctions.some((fn) => fn.function_name === name && fn.security_definer && !fn.service_role_execute && !fn.authenticated_execute && !fn.anon_execute));

  console.log(
    JSON.stringify(
      {
        functions,
        missingFunctions,
        missingPolicies,
        missingRls,
        ok: missingRls.length === 0 && missingPolicies.length === 0 && missingFunctions.length === 0 && unsafeServiceFunctions.length === 0 && unsafeAuthenticatedFunctions.length === 0 && unsafeInternalFunctions.length === 0,
        authenticatedOnlyFunctions,
        internalOnlyFunctions,
        rls,
        serviceOnlyFunctions,
        unsafeServiceFunctions,
        unsafeAuthenticatedFunctions,
        unsafeInternalFunctions,
      },
      null,
      2,
    ),
  );

  if (missingRls.length || missingPolicies.length || missingFunctions.length || unsafeServiceFunctions.length || unsafeAuthenticatedFunctions.length || unsafeInternalFunctions.length) {
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
