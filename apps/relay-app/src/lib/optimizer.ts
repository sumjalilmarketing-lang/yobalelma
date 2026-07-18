import type { RelayPackage, RelayState, StorageLocation } from "./types";

export function locationUtilization(location: StorageLocation) {
  return Math.round(location.occupied / location.capacity * 100);
}

export function suggestBestLocation(pkg: RelayPackage, locations: StorageLocation[]) {
  const volume = pkg.dimensions.lengthCm * pkg.dimensions.widthCm * pkg.dimensions.heightCm;
  const preferredKind: StorageLocation["kind"] = pkg.qualityScore < 70 ? "secure_cage" : volume > 120_000 || pkg.weightKg > 30 ? "oversize" : pkg.otpRequired ? "locker" : pkg.status === "awaiting_carrier" ? "shelf" : "shelf";
  const candidates = locations.filter((item) => item.status !== "full" && item.status !== "maintenance" && item.occupied < item.capacity && item.maxWeightKg >= pkg.weightKg);
  const ranked = candidates.map((item) => ({ location: item, score: (item.kind === preferredKind ? 60 : 10) + (100 - locationUtilization(item)) * 0.35 + (item.status === "available" ? 10 : 0) })).sort((a, b) => b.score - a.score);
  return ranked[0] ? { location: ranked[0].location, confidence: Math.min(98, Math.round(ranked[0].score)) } : null;
}

export function detectRelayAnomalies(state: RelayState, reference = new Date()) {
  return state.packages.flatMap((pkg) => {
    const anomalies: Array<{ trackingCode: string; type: string; severity: "medium" | "high"; message: string }> = [];
    if (new Date(pkg.dueAt) < reference && !["handed_over", "refused"].includes(pkg.status)) anomalies.push({ trackingCode: pkg.trackingCode, type: "late", severity: "high", message: "Colis en retard dans le point relais" });
    if (["stored", "awaiting_carrier", "awaiting_recipient"].includes(pkg.status) && !pkg.locationCode) anomalies.push({ trackingCode: pkg.trackingCode, type: "forgotten", severity: "high", message: "Colis stocké sans emplacement" });
    if (Math.abs(pkg.weightKg - pkg.expectedWeightKg) > Math.max(0.5, pkg.expectedWeightKg * 0.12)) anomalies.push({ trackingCode: pkg.trackingCode, type: "weight", severity: "medium", message: "Écart de poids supérieur à la tolérance" });
    if (pkg.locationCode?.startsWith("A-") && (pkg.weightKg > 20 || pkg.dimensions.lengthCm > 100)) anomalies.push({ trackingCode: pkg.trackingCode, type: "storage", severity: "high", message: "Emplacement incompatible avec le gabarit" });
    return anomalies;
  });
}

export function forecastCapacity(state: RelayState) {
  const capacity = state.locations.reduce((sum, item) => sum + item.capacity, 0);
  const occupied = state.locations.reduce((sum, item) => sum + item.occupied, 0);
  const expectedToday = state.packages.filter((item) => item.status === "expected").length + 9;
  const departuresToday = state.packages.filter((item) => item.status === "awaiting_carrier" || item.status === "awaiting_recipient").length + 4;
  const projected = occupied + expectedToday - departuresToday;
  return { capacity, occupied, projected, utilization: Math.round(occupied / capacity * 100), projectedUtilization: Math.round(projected / capacity * 100), remaining: Math.max(0, capacity - projected), risk: projected / capacity >= .9 ? "high" : projected / capacity >= .75 ? "medium" : "low" } as const;
}
