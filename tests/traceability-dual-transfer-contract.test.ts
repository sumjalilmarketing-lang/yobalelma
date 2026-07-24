import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const migration = readFileSync(resolve(process.cwd(), "supabase/migrations/20260724090000_dual_custody_transfer_validation.sql"), "utf8");
const lockMigration = readFileSync(resolve(process.cwd(), "supabase/migrations/20260724091000_lock_dual_transfer_internals.sql"), "utf8");

describe("dual custody transfer database contract", () => {
  it("records independent giver and receiver confirmations without direct table writes", () => {
    expect(migration).toContain("giver_actor_id uuid not null");
    expect(migration).toContain("receiver_actor_id uuid not null");
    expect(migration).toContain("parcel_custody_transfer_distinct_actors");
    expect(migration).toContain("revoke insert,update,delete on public.parcel_custody_transfer_requests from anon,authenticated");
  });

  it("changes custody only after a valid receiver decision", () => {
    expect(migration).toContain("if auth.uid()<>transfer.receiver_actor_id");
    expect(migration).toContain("event_id:=public.record_parcel_traceability_event_internal(payload)");
    expect(migration.indexOf("event_id:=public.record_parcel_traceability_event_internal(payload)")).toBeGreaterThan(migration.indexOf("Receiver identity mismatch"));
  });

  it("rejects expiration, replay with a different key, wrong actor and incoherent position", () => {
    for (const guard of ["Transfer expired", "Transfer already finalized", "Actor mismatch", "Incoherent receiver position"]) {
      expect(migration).toContain(guard);
    }
    expect(migration).toContain("decision_idempotency_key=p_decision_idempotency_key");
  });

  it("requires exact stage evidence and lets only the receiver verify giver proofs", () => {
    expect(migration).toContain("assert_dual_transfer_proofs");
    expect(migration).toContain("array['otp','signature','delivery','gps']");
    expect(migration).toContain("captured_by=transfer.giver_actor_id");
    expect(migration).toContain("verified_by=auth.uid()");
  });

  it("blocks sensitive transitions through the generic authenticated RPC", () => {
    expect(migration).toContain("Sensitive custody transitions require dual validation");
    expect(migration).toMatch(/revoke all on function public\.record_parcel_traceability_event_internal\(jsonb\) from public,anon,authenticated/u);
    expect(lockMigration).toContain("from public,anon,authenticated,service_role");
    expect(migration).toContain("grant execute on function public.request_parcel_custody_transfer(jsonb) to authenticated");
    expect(migration).toContain("grant execute on function public.decide_parcel_custody_transfer");
  });
});
