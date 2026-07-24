import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { tryCreateSupabaseServerClient } from "@/lib/supabase/server";
import type { AdminSession } from "./types";

export const customsRoles = ["super_admin", "admin", "customs_manager", "customs_agent", "compliance_manager", "compliance_agent", "customs_broker", "customs_broker_manager", "finance_customs_agent", "auditor"];
export const customsSections = ["dossiers", "declarations", "documents", "marchandises", "inspections", "droits-taxes", "mainlevees", "blocages", "saisies", "commissionnaires", "bureaux", "regles-pays", "codes-hs", "incidents", "audit", "integrations", "statistiques"] as const;
export type CustomsSection = (typeof customsSections)[number];

export function canAccessCustoms(session: AdminSession) { return session.roleIds.some((role) => customsRoles.includes(role)); }

export async function loadCustomsData(session: AdminSession) {
  if (!canAccessCustoms(session)) return null;
  const supabase = await tryCreateSupabaseServerClient();
  const officialConfigured = Boolean(process.env.CUSTOMS_PROVIDER && process.env.CUSTOMS_BASE_URL && process.env.CUSTOMS_CLIENT_ID && process.env.CUSTOMS_CLIENT_SECRET && process.env.CUSTOMS_WEBHOOK_SECRET);
  if (!supabase) return empty(false, officialConfigured);
  const db = supabase as SupabaseClient;
  const results = await Promise.all([
    db.from("customs_cases").select("id, shipment_id, origin_country, destination_country, customs_provider, declaration_reference, status, risk_level, inspection_required, declared_value, currency, estimated_duties, final_duties, broker_id, created_at, submitted_at, released_at").order("created_at", { ascending: false }).limit(300),
    db.from("customs_documents").select("id, customs_case_id, document_type, filename, status, created_at, verified_at").order("created_at", { ascending: false }).limit(300),
    db.from("customs_events").select("id, customs_case_id, event_type, source, verified, created_at, processed_at").order("created_at", { ascending: false }).limit(300),
    db.from("customs_decisions").select("id, customs_case_id, decision_type, decision_reference, authority, source, verified, effective_at, received_at").order("received_at", { ascending: false }).limit(200),
    db.from("customs_duties").select("id, customs_case_id, duty_type, amount, currency, calculation_source, status, external_reference, created_at").order("created_at", { ascending: false }).limit(300),
    db.from("customs_brokers").select("id, organization_name, license_reference, license_country, status, sla_minutes, verified_at").order("organization_name").limit(200),
    db.from("customs_offices").select("id, country_code, office_code, name, status, verified_at").order("country_code").limit(300),
    db.from("customs_rule_sets").select("id, country_code, version, name, status, effective_from, effective_to, source_reference, approved_at").order("created_at", { ascending: false }).limit(200),
    db.from("customs_hs_suggestions").select("id, customs_item_id, proposed_code, source, confidence, status, created_at, validated_at").order("created_at", { ascending: false }).limit(300),
    db.from("customs_outbox").select("id, customs_case_id, operation, status, attempt_count, max_attempts, next_attempt_at, last_error_code, created_at").order("created_at", { ascending: false }).limit(100),
  ]);
  return {
    cases: results[0].data ?? [], documents: results[1].data ?? [], events: results[2].data ?? [], decisions: results[3].data ?? [],
    duties: results[4].data ?? [], brokers: results[5].data ?? [], offices: results[6].data ?? [], rules: results[7].data ?? [],
    hsSuggestions: results[8].data ?? [], outbox: results[9].data ?? [], officialConfigured, sourceReady: results.every((result) => !result.error),
  };
}

function empty(sourceReady: boolean, officialConfigured: boolean) {
  return { cases: [], documents: [], events: [], decisions: [], duties: [], brokers: [], offices: [], rules: [], hsSuggestions: [], outbox: [], officialConfigured, sourceReady };
}
