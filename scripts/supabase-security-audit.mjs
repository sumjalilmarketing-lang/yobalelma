import nextEnv from "@next/env";

const { loadEnvConfig } = nextEnv;

const PROJECT_REF = "rgcgtcycbiuhcaoaadbh";
const MANAGEMENT_QUERY_URL = `https://api.supabase.com/v1/projects/${PROJECT_REF}/database/query`;

const TABLES = [
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
];

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

  const missingRls = TABLES.filter((table) => !rls.some((row) => row.table_name === table && row.rls_enabled));
  const missingPolicies = rls.filter((row) => row.policy_count === 0).map((row) => row.table_name);
  const missingFunctions = FUNCTIONS.filter(
    (fn) => !functions.some((row) => row.function_name === fn),
  );

  console.log(
    JSON.stringify(
      {
        functions,
        missingFunctions,
        missingPolicies,
        missingRls,
        ok: missingRls.length === 0 && missingPolicies.length === 0 && missingFunctions.length === 0,
        rls,
      },
      null,
      2,
    ),
  );

  if (missingRls.length || missingPolicies.length || missingFunctions.length) {
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
