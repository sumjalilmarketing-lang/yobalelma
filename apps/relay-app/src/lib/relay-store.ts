import type { RelayPackage, RelayState, StorageLocation } from "./types";

const now = new Date();
const at = (minutes: number) => new Date(now.getTime() + minutes * 60_000).toISOString();

const locations: StorageLocation[] = [
  { id: "loc-a1", code: "A-01", kind: "shelf", zone: "Réception", capacity: 12, occupied: 8, maxWeightKg: 80, status: "available" },
  { id: "loc-a2", code: "A-02", kind: "shelf", zone: "Réception", capacity: 12, occupied: 11, maxWeightKg: 80, status: "near_capacity" },
  { id: "loc-b1", code: "B-01", kind: "shelf", zone: "Départs", capacity: 16, occupied: 9, maxWeightKg: 120, status: "available" },
  { id: "loc-c1", code: "C-01", kind: "locker", zone: "Retraits", capacity: 8, occupied: 8, maxWeightKg: 35, status: "full" },
  { id: "loc-c2", code: "C-02", kind: "locker", zone: "Retraits", capacity: 8, occupied: 3, maxWeightKg: 35, status: "available" },
  { id: "loc-sec", code: "SEC-01", kind: "secure_cage", zone: "Sécurisée", capacity: 10, occupied: 4, maxWeightKg: 100, status: "available" },
  { id: "loc-x1", code: "X-01", kind: "oversize", zone: "Hors gabarit", capacity: 5, occupied: 4, maxWeightKg: 300, status: "near_capacity" },
];

const statuses: RelayPackage["status"][] = ["expected", "received", "controlled", "stored", "stored", "awaiting_carrier", "awaiting_recipient", "stored", "anomaly", "refused", "stored", "awaiting_recipient", "awaiting_carrier", "received", "stored", "handed_over"];
const names = ["Awa Ndiaye", "Moussa Fall", "Fatou Diallo", "Ibrahima Ba", "Mariama Sow", "Cheikh Diop", "Sokhna Gueye", "Ousmane Kane"];
const locationCodes = [undefined, undefined, "A-01", "A-01", "A-02", "B-01", "C-01", "A-02", "A-02", undefined, "SEC-01", "C-02", "B-01", undefined, "X-01", undefined];

const packages: RelayPackage[] = statuses.map((status, index) => {
  const expectedWeightKg = Number((1.8 + index * 0.85).toFixed(1));
  const oversize = index === 14;
  const expectedDimensions = oversize ? { lengthCm: 138, widthCm: 62, heightCm: 48 } : { lengthCm: 32 + index, widthCm: 24, heightCm: 18 };
  return {
    id: `pkg-${index + 1}`,
    trackingCode: `YBL-SN-2607-${String(index + 201).padStart(4, "0")}`,
    sender: names[(index + 3) % names.length], recipient: names[index % names.length], destination: index % 3 === 0 ? "Dakar Plateau" : index % 3 === 1 ? "Hub DSS" : "Paris",
    status, weightKg: index === 8 ? expectedWeightKg + 2.7 : expectedWeightKg, expectedWeightKg,
    dimensions: index === 8 ? { ...expectedDimensions, widthCm: expectedDimensions.widthCm + 11 } : expectedDimensions,
    expectedDimensions, locationCode: locationCodes[index], carrierBatch: index % 2 ? "LOT-DSS-0718-B" : "LOT-DSS-0718-A",
    receivedAt: at(-(index * 95 + 25)), dueAt: at(index === 7 ? -120 : index === 8 ? -35 : 180 + index * 40),
    photoCount: index === 1 ? 0 : 2 + index % 3, qualityScore: index === 8 ? 54 : index === 9 ? 42 : 92 + index % 7,
    otpRequired: status === "awaiting_recipient",
  };
});

const state: RelayState = {
  relayPoint: { id: "relay-orange-plateau", name: "Orange Plateau", code: "RLY-DKR-001", address: "12 avenue Léopold Sédar Senghor, Dakar", network: "Orange", capacity: 86, openUntil: "20:00" },
  packages,
  locations,
  incidents: [
    { id: "inc-1", type: "storage_mismatch", title: "Colis lourd rangé en rayonnage standard", severity: "high", status: "investigating", at: at(-28), trackingCode: packages[8].trackingCode },
    { id: "inc-2", type: "capacity", title: "Casiers C-01 arrivés à saturation", severity: "medium", status: "open", at: at(-54) },
    { id: "inc-3", type: "damaged", title: "Emballage refusé après contrôle photo", severity: "low", status: "resolved", at: at(-215), trackingCode: packages[9].trackingCode },
  ],
  events: [
    { id: "evt-1", at: at(-4), action: "package_scanned", actor: "Aminata Cissé", entity: packages[1].trackingCode, detail: "Réception QR enregistrée" },
    { id: "evt-2", at: at(-18), action: "location_assigned", actor: "Assistant Relay", entity: packages[12].trackingCode, detail: "Emplacement B-01 proposé et validé" },
    { id: "evt-3", at: at(-42), action: "otp_verified", actor: "Mamadou Diop", entity: packages[11].trackingCode, detail: "Remise destinataire signée" },
    { id: "evt-4", at: at(-66), action: "batch_handover", actor: "Aminata Cissé", entity: "LOT-DSS-0718-A", detail: "7 colis remis au transporteur interne" },
  ],
  notifications: [
    { id: "n-1", title: "Colis à traiter", message: `${packages[7].trackingCode} dépasse son heure de départ.`, at: at(-6), read: false },
    { id: "n-2", title: "Capacité casiers", message: "C-01 est plein. Utilisez C-02 pour les prochains retraits.", at: at(-31), read: false },
    { id: "n-3", title: "Collecte confirmée", message: "Le transporteur interne arrive dans 24 minutes.", at: at(-48), read: true },
  ],
  sync: { pending: 2, lastSyncedAt: at(-3), online: true },
};

export function getRelayState(): RelayState { return structuredClone(state); }
