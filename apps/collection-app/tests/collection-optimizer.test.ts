import { describe, expect, it } from "vitest";
import { detectOperationalAnomalies, haversineKm, optimizeStops, predictDelay } from "../src/lib/optimizer";
import { getCollectionState } from "../src/lib/collection-store";

describe("Collection route intelligence", () => {
  it("computes realistic distances", () => { expect(haversineKm({ lat: 14.7167, lng: -17.4677 }, { lat: 14.67, lng: -17.0733 })).toBeGreaterThan(40); });
  it("optimizes every stop without duplicates", () => { const stops=getCollectionState().missions[0].stops; const result=optimizeStops(stops); expect(result.stops).toHaveLength(stops.length); expect(new Set(result.stops.map((stop)=>stop.id)).size).toBe(stops.length); expect(result.distanceKm).toBeGreaterThan(0); });
  it("predicts delay and forgotten packages", () => { const mission=getCollectionState().missions[0]; expect(predictDelay(mission,1.2).risk).toBeGreaterThan(0); expect(detectOperationalAnomalies(mission)).toContain("3 colis manquant(s) à Relais Parcelles"); });
});
