import { describe, expect, it } from "vitest";
import { getCollectionState } from "../src/lib/collection-store";
describe("Collection operational state", () => {
  it("contains realistic missions without client pickup", () => { const state=getCollectionState(); expect(state.missions.length).toBeGreaterThanOrEqual(3); expect(state.missions.flatMap((mission)=>mission.stops).every((stop)=>["relay","hub","airport","port","distribution_center"].includes(stop.kind))).toBe(true); });
  it("keeps load within vehicle capacity", () => { const {vehicle}=getCollectionState(); expect(vehicle).not.toBeNull(); expect(vehicle!.loadKg).toBeLessThanOrEqual(vehicle!.capacityKg); });
  it("returns isolated snapshots", () => { const one=getCollectionState(); expect(one.vehicle).not.toBeNull(); one.vehicle!.fuelPercent=0; expect(getCollectionState().vehicle?.fuelPercent).toBe(68); });
});
