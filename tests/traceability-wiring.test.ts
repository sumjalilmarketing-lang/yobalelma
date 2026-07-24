import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const read = (path: string) => readFileSync(resolve(process.cwd(), path), "utf8");

describe("traceability blocker closure", () => {
  const migration = read("supabase/migrations/20260722064000_traceability_blocker_closure.sql");
  const operationalBridges = `${migration}\n${read("supabase/migrations/20260722066000_bridge_payment_notification_traceability.sql")}`;

  it("bridges every critical operational ledger in the database transaction", () => {
    for (const trigger of [
      "collection_movements_traceability", "hub_inbound_traceability", "hub_inventory_traceability",
      "hub_handover_traceability", "relay_handover_traceability", "operational_incident_traceability",
      "shipment_status_traceability", "proof_of_delivery_traceability", "delivery_event_traceability",
      "customs_event_traceability", "manual_correction_traceability", "shipment_status_event_guard",
      "payment_event_traceability", "notification_event_traceability",
    ]) expect(operationalBridges).toContain(trigger);
  });

  it("keeps internal append and global audit unavailable to browser roles", () => {
    const lockMigration = read("supabase/migrations/20260722065000_lock_internal_traceability_append.sql");
    expect(migration).toMatch(/revoke all on function public\.append_verified_operational_trace[\s\S]*from public,anon,authenticated/u);
    expect(lockMigration).toContain("authenticated, service_role");
    expect(migration).toMatch(/revoke all on function public\.run_parcel_traceability_consistency_audit\(\) from public,anon,authenticated/u);
    expect(migration).toContain("grant execute on function public.run_parcel_traceability_consistency_audit() to service_role");
  });

  it("uses atomic traced RPCs instead of multi-call status writes", () => {
    const collection = read("app/api/collection/manifests/route.ts");
    const relay = read("apps/relay-app/app/api/relay/storage/route.ts");
    expect(collection).toContain('rpc("add_collection_manifest_item_traced"');
    expect(collection).not.toContain('.from("shipments").update');
    expect(relay).toContain('rpc("record_relay_storage_traced"');
    expect(relay).not.toContain('.from("relay_inventory").update');
  });

  it("exports only through a private bucket, short signed URL and access log", () => {
    const route = read("apps/admin-app/app/api/admin/traceability/passport-pdf/route.ts");
    expect(migration).toContain("'traceability-exports','traceability-exports',false");
    expect(route).toContain("createSignedUrl(storagePath, expiresIn");
    expect(route).toContain('p_access_type: "export"');
    expect(route).toContain("const expiresIn = 300");
  });

  it("requires a verified photo for applying or breaking a seal", () => {
    expect(migration).toContain("proof_type='seal_photo' and verification_status='verified'");
    expect(migration).toContain("'unexpected_seal_break','critical'");
  });
});
