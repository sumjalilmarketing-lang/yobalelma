import {describe,expect,it} from "vitest";
import {getRelayState} from "../src/lib/relay-store";
describe("Relay data",()=>{it("contains realistic operational data",()=>{const state=getRelayState();expect(state.packages.length).toBeGreaterThanOrEqual(16);expect(state.locations.length).toBeGreaterThanOrEqual(7);expect(state.relayPoint.network).toBe("Orange")});it("returns an isolated clone",()=>{const first=getRelayState();first.locations[0].occupied=0;expect(getRelayState().locations[0].occupied).toBeGreaterThan(0)})});
