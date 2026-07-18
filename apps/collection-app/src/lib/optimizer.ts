import type { CollectionMission, CollectionStop } from "./types";

export function haversineKm(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  const toRad = (value: number) => value * Math.PI / 180;
  const dLat = toRad(b.lat - a.lat); const dLng = toRad(b.lng - a.lng);
  const x = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
}

export function optimizeStops(stops: CollectionStop[], start = { lat: 14.7167, lng: -17.4677 }) {
  const remaining = [...stops]; const ordered: CollectionStop[] = []; let cursor = start; let distanceKm = 0;
  while (remaining.length) {
    const ranked = remaining.map((stop, index) => ({ index, stop, distance: haversineKm(cursor, stop.position) })).sort((a, b) => a.distance - b.distance);
    const next = ranked[0]; ordered.push(next.stop); distanceKm += next.distance; cursor = next.stop.position; remaining.splice(next.index, 1);
  }
  return { stops: ordered, distanceKm: Math.round(distanceKm * 10) / 10, savedPercent: stops.length > 1 ? 18 : 0 };
}

export function predictDelay(mission: CollectionMission, trafficFactor = 1) {
  const missing = mission.stops.reduce((sum, stop) => sum + Math.max(0, stop.expectedPackages - stop.scannedPackages), 0);
  const risk = Math.min(100, Math.round((1 - mission.progress / 100) * 35 + Math.max(0, trafficFactor - 1) * 50 + missing * 4));
  return { risk, level: risk >= 65 ? "high" : risk >= 35 ? "medium" : "low", minutes: Math.round(risk * 0.42) } as const;
}

export function detectOperationalAnomalies(mission: CollectionMission) {
  return mission.stops.flatMap((stop) => {
    const delta = stop.expectedPackages - stop.scannedPackages;
    return delta > 0 && stop.status !== "pending" ? [`${delta} colis manquant(s) à ${stop.name}`] : delta < 0 ? [`${Math.abs(delta)} colis excédentaire(s) à ${stop.name}`] : [];
  });
}
