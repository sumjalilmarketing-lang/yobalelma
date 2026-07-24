import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { tryCreateSupabaseServerClient } from "@/lib/supabase/server";
import type { AdminSession } from "./types";
import { partnerRelaySchema, relaySourceHash, type PartnerRelay } from "@/lib/partners/relay-provider";

export const orangeIntegrationRoles = ["super_admin", "admin", "partner_manager", "orange_partner_manager", "relay_partner_manager", "auditor"];

export function canAccessOrangeIntegrations(session: AdminSession) {
  return session.roleIds.some((role) => orangeIntegrationRoles.includes(role));
}

export async function loadOrangeIntegrationData(session: AdminSession) {
  if (!canAccessOrangeIntegrations(session)) return null;
  const supabase = await tryCreateSupabaseServerClient();
  const configured = Boolean(process.env.ORANGE_RELAY_BASE_URL && process.env.ORANGE_RELAY_CLIENT_ID && process.env.ORANGE_RELAY_CLIENT_SECRET);
  if (!supabase) return { configured, relays: [], runs: [], sourceReady: false };
  const db = supabase as SupabaseClient;
  const [relaysResult, runsResult] = await Promise.all([
    db.from("relay_points").select("id, name, city, country, status, external_provider, external_id, partner_name, availability, last_synced_at").eq("external_provider", "orange").order("name").limit(500),
    db.from("partner_location_sync_runs").select("id, provider, status, imported_count, updated_count, deactivated_count, rejected_count, started_at, completed_at, error_code").eq("provider", "orange").order("started_at", { ascending: false }).limit(25),
  ]);
  return {
    configured,
    relays: relaysResult.data ?? [],
    runs: runsResult.data ?? [],
    sourceReady: !relaysResult.error && !runsResult.error,
  };
}

export async function persistPartnerRelaySnapshot(input: {
  db: SupabaseClient;
  session: AdminSession;
  relays: PartnerRelay[];
  fullSnapshot: boolean;
}) {
  if (!canAccessOrangeIntegrations(input.session) || !input.session.roleIds.some((role) => role !== "auditor" && orangeIntegrationRoles.includes(role))) {
    throw new Error("ORANGE_RELAY_SYNC_FORBIDDEN");
  }
  const relays = input.relays.map((relay) => partnerRelaySchema.parse(relay));
  if (!relays.length) throw new Error("ORANGE_RELAY_EMPTY_SNAPSHOT_REFUSED");
  const externalIds = new Set(relays.map((relay) => relay.externalId));
  if (externalIds.size !== relays.length) throw new Error("ORANGE_RELAY_DUPLICATE_EXTERNAL_ID");

  const { data: run, error: runError } = await input.db.from("partner_location_sync_runs").insert({
    provider: "orange", full_snapshot: input.fullSnapshot, created_by: input.session.userId,
  }).select("id").single();
  if (runError || !run) throw new Error("ORANGE_RELAY_SYNC_RUN_FAILED");

  try {
    const { data: existing, error: existingError } = await input.db.from("relay_points").select("external_id, source_hash").eq("external_provider", "orange");
    if (existingError) throw new Error("ORANGE_RELAY_READ_FAILED");
    const previous = new Map((existing ?? []).map((item) => [item.external_id as string, item.source_hash as string | null]));
    const now = new Date().toISOString();
    const rows = relays.map((relay) => ({
      external_provider: "orange", external_id: relay.externalId, partner_name: "Orange", name: relay.name,
      contact_name: relay.contactName ?? null, contact_phone: relay.contactPhone ?? null,
      address_line1: relay.addressLine1, city: relay.city, country: relay.countryCode, postal_code: relay.postalCode ?? null,
      capacity_slots: relay.capacitySlots, status: relay.active ? "active" : "inactive",
      latitude: relay.latitude ?? null, longitude: relay.longitude ?? null, opening_hours: relay.openingHours,
      services: relay.services, availability: relay.availability, external_updated_at: relay.externalUpdatedAt ?? null,
      last_synced_at: now, source_hash: relaySourceHash(relay), created_by: input.session.userId,
    }));
    const { error: upsertError } = await input.db.from("relay_points").upsert(rows, { onConflict: "external_provider,external_id" });
    if (upsertError) throw new Error("ORANGE_RELAY_UPSERT_FAILED");
    let deactivatedCount = 0;
    if (input.fullSnapshot) {
      const missing = [...previous.keys()].filter((externalId) => !externalIds.has(externalId));
      if (missing.length) {
        const { data: deactivated, error: deactivateError } = await input.db.from("relay_points").update({ status: "inactive", availability: "unavailable", last_synced_at: now }).eq("external_provider", "orange").in("external_id", missing).select("id");
        if (deactivateError) throw new Error("ORANGE_RELAY_DEACTIVATION_FAILED");
        deactivatedCount = deactivated?.length ?? 0;
      }
    }
    const importedCount = rows.filter((row) => !previous.has(row.external_id)).length;
    const updatedCount = rows.filter((row) => previous.has(row.external_id) && previous.get(row.external_id) !== row.source_hash).length;
    const { error: completeError } = await input.db.from("partner_location_sync_runs").update({ status: "completed", imported_count: importedCount, updated_count: updatedCount, deactivated_count: deactivatedCount, completed_at: now }).eq("id", run.id);
    if (completeError) throw new Error("ORANGE_RELAY_SYNC_COMPLETION_FAILED");
    return { runId: run.id as string, importedCount, updatedCount, deactivatedCount };
  } catch (error) {
    const code = error instanceof Error && /^ORANGE_RELAY_[A-Z_]+$/u.test(error.message) ? error.message : "ORANGE_RELAY_SYNC_FAILED";
    await input.db.from("partner_location_sync_runs").update({ status: "failed", error_code: code, completed_at: new Date().toISOString() }).eq("id", run.id);
    throw new Error(code);
  }
}
