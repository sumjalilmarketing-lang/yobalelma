import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { tryCreateSupabaseServerClient } from "@/lib/supabase/server";
import type { AdminSession } from "./types";

export type ParcelPassportData = {
  shipment: Record<string, unknown>;
  parcel: Record<string, unknown> | null;
  state: Record<string, unknown> | null;
  events: Record<string, unknown>[];
  proofs: Record<string, unknown>[];
  seals: Record<string, unknown>[];
  anomalies: Record<string, unknown>[];
};

export function canInvestigateParcels(session: AdminSession) {
  return session.roleIds.some((role) => ["super_admin", "admin", "country_manager", "operations_manager", "dispatch_manager", "hub_manager", "relay_manager", "collection_manager", "local_delivery_manager", "traveler_manager", "customs_manager", "compliance_manager", "customer_support_manager", "security_manager", "auditor"].includes(role));
}

export async function loadParcelPassport(session: AdminSession, reference?: string): Promise<ParcelPassportData | null> {
  if (!reference || !canInvestigateParcels(session)) return null;
  const supabase = await tryCreateSupabaseServerClient();
  if (!supabase) return null;
  const client = supabase as unknown as SupabaseClient;
  const normalized = reference.trim().toUpperCase();
  let shipmentQuery = client.from("shipments").select("id, tracking_code, status, scope, origin_city, origin_country, destination_city, destination_country, latest_delivery_date, created_at, updated_at");
  shipmentQuery = /^[0-9a-f-]{36}$/i.test(normalized) ? shipmentQuery.eq("id", normalized) : shipmentQuery.eq("tracking_code", normalized);
  const { data: shipment } = await shipmentQuery.maybeSingle();
  if (!shipment) return null;
  const { data: parcel } = await client.from("shipment_packages").select("id, category, title, weight_kg, length_cm, width_cm, height_cm, declared_value_cents, fragile, created_at").eq("shipment_id", shipment.id).maybeSingle();
  if (!parcel) return { shipment, parcel: null, state: null, events: [], proofs: [], seals: [], anomalies: [] };
  const [stateResult, eventsResult, proofsResult, sealsResult, anomaliesResult] = await Promise.all([
    client.from("parcel_custody_state").select("*").eq("parcel_id", parcel.id).maybeSingle(),
    client.from("parcel_traceability_events").select("id, sequence_no, event_type, stage_before, stage_after, previous_custodian_type, previous_custodian_id, new_custodian_type, new_custodian_id, previous_location_id, new_location_id, country_code, latitude, longitude, location_accuracy, location_source, occurred_at, received_at, recorded_by_role, application_source, event_source, parcel_condition, condition_severity, anomaly_status, validation_status, correction_of_event_id, correction_reason, previous_event_hash, event_hash").eq("parcel_id", parcel.id).order("sequence_no", { ascending: false }).limit(250),
    client.from("parcel_traceability_proofs").select("id, event_id, proof_type, verification_status, captured_at, device_id, latitude, longitude, retention_until, legal_hold").eq("parcel_id", parcel.id).order("captured_at", { ascending: false }).limit(100),
    client.from("parcel_seals").select("id, status, applied_at, applied_location_id, broken_at, break_reason, replacement_seal_id").eq("parcel_id", parcel.id).order("applied_at", { ascending: false }),
    client.from("parcel_traceability_anomalies").select("id, anomaly_type, severity, status, title, assigned_to, incident_id, detected_at, resolved_at, resolution").eq("parcel_id", parcel.id).order("detected_at", { ascending: false }),
  ]);
  return { shipment, parcel, state: stateResult.data, events: eventsResult.data ?? [], proofs: proofsResult.data ?? [], seals: sealsResult.data ?? [], anomalies: anomaliesResult.data ?? [] };
}
