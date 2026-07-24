import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const sql = readFileSync(join(process.cwd(), "supabase/migrations/20260722063000_parcel_traceability_passport.sql"), "utf8");

describe("traceability database foundation", () => {
  it.each(["parcel_traceability_events", "parcel_custody_state", "parcel_traceability_proofs", "parcel_proof_requirements", "parcel_seals", "parcel_traceability_anomalies", "parcel_passport_access_log"])("creates %s", (table) => expect(sql).toContain(`create table public.${table}`));
  it("blocks historical updates and deletes", () => { expect(sql).toContain("before update or delete on public.parcel_traceability_events"); expect(sql).toContain("record a correction or cancellation event"); });
  it("serializes custody changes and rejects duplicate delivery", () => { expect(sql).toContain("for update;"); expect(sql).toContain("Parcel already delivered"); expect(sql).toContain("Previous custodian mismatch"); });
  it("requires verified configurable evidence", () => { expect(sql).toContain("parcel_proof_requirements"); expect(sql).toContain("verification_status='verified'"); expect(sql).toContain("Required verified proofs missing"); });
  it("uses idempotency and a chained event hash", () => { expect(sql).toContain("unique(parcel_id,idempotency_key)"); expect(sql).toContain("previous_event_hash"); expect(sql).toContain("digest(concat_ws"); });
  it("enables RLS and restricts direct mutations", () => { expect(sql.match(/enable row level security/g)?.length).toBeGreaterThanOrEqual(7); expect(sql).toContain("revoke insert,update,delete"); });
  it("emits sanitized Control Tower and Digital Twin work", () => { expect(sql).toContain("control_tower_events"); expect(sql).toContain("'digital_twin'"); expect(sql).toContain("sanitized_payload"); });
});
