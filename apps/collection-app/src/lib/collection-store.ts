import type { CollectionState } from "./types";

const now = new Date();
const at = (minutes: number) => new Date(now.getTime() + minutes * 60_000).toISOString();

const state: CollectionState = {
  missions: [
    {
      id: "mission-dkr-001", code: "COL-DKR-260718-01", title: "Tournée relais Dakar → Hub DSS", origin: "Relais Plateau", destination: "Hub DSS",
      status: "en_route", priority: "urgent", distanceKm: 31.8, durationMinutes: 96, packageCount: 42, batchCount: 3, weightKg: 286.4,
      progress: 58, assignedAt: at(-150), scheduledStart: at(-95), optimized: true, carbonKg: 7.2,
      stops: [
        { id: "stop-1", kind: "relay", name: "Relais Plateau", address: "12 avenue Léopold Sédar Senghor, Dakar", eta: at(-60), status: "completed", position: { lat: 14.6687, lng: -17.4322, label: "Plateau" }, expectedPackages: 14, scannedPackages: 14, signatureRequired: true },
        { id: "stop-2", kind: "relay", name: "Relais Liberté 6", address: "VDN, Liberté 6, Dakar", eta: at(-15), status: "completed", position: { lat: 14.7264, lng: -17.4656, label: "Liberté 6" }, expectedPackages: 12, scannedPackages: 12, signatureRequired: true },
        { id: "stop-3", kind: "relay", name: "Relais Parcelles", address: "Unité 15, Parcelles Assainies", eta: at(18), status: "arrived", position: { lat: 14.7645, lng: -17.432, label: "Parcelles" }, expectedPackages: 16, scannedPackages: 13, signatureRequired: true },
        { id: "stop-4", kind: "hub", name: "Hub Logistique DSS", address: "Zone fret, Aéroport Blaise Diagne", eta: at(78), status: "pending", position: { lat: 14.67, lng: -17.0733, label: "DSS" }, expectedPackages: 42, scannedPackages: 26, signatureRequired: true },
      ],
    },
    {
      id: "mission-dkr-002", code: "COL-DKR-260718-02", title: "Transfert Hub DSS → Port de Dakar", origin: "Hub DSS", destination: "Terminal Portuaire",
      status: "assigned", priority: "high", distanceKm: 49.6, durationMinutes: 82, packageCount: 28, batchCount: 2, weightKg: 412,
      progress: 0, assignedAt: at(-20), scheduledStart: at(180), optimized: true, carbonKg: 11.5,
      stops: [
        { id: "stop-5", kind: "hub", name: "Hub Logistique DSS", address: "Zone fret, Aéroport Blaise Diagne", eta: at(180), status: "pending", position: { lat: 14.67, lng: -17.0733, label: "DSS" }, expectedPackages: 28, scannedPackages: 0, signatureRequired: true },
        { id: "stop-6", kind: "port", name: "Port Autonome de Dakar", address: "Môle 8, Dakar", eta: at(270), status: "pending", position: { lat: 14.681, lng: -17.425, label: "Port" }, expectedPackages: 28, scannedPackages: 0, signatureRequired: true },
      ],
    },
    {
      id: "mission-dkr-003", code: "COL-DKR-260718-03", title: "Navette Hub DSS → Aéroport fret", origin: "Hub DSS", destination: "Terminal fret DSS",
      status: "completed", priority: "normal", distanceKm: 4.3, durationMinutes: 27, packageCount: 18, batchCount: 1, weightKg: 132.5,
      progress: 100, assignedAt: at(-1440), scheduledStart: at(-1320), optimized: true, carbonKg: 1.1,
      stops: [
        { id: "stop-7", kind: "hub", name: "Hub Logistique DSS", address: "Zone fret DSS", eta: at(-1320), status: "completed", position: { lat: 14.67, lng: -17.0733, label: "Hub" }, expectedPackages: 18, scannedPackages: 18, signatureRequired: true },
        { id: "stop-8", kind: "airport", name: "Terminal fret DSS", address: "Aéroport International Blaise Diagne", eta: at(-1280), status: "completed", position: { lat: 14.7397, lng: -17.49, label: "Terminal fret" }, expectedPackages: 18, scannedPackages: 18, signatureRequired: true },
      ],
    },
  ],
  packages: Array.from({ length: 16 }, (_, index) => ({
    id: `pkg-${index + 1}`, trackingCode: `YBL-SN-2607-${String(index + 101).padStart(4, "0")}`, batchCode: index < 8 ? "LOT-DSS-PAR-0718" : "LOT-DSS-MRS-0718",
    status: index < 12 ? "loaded" : index === 15 ? "anomaly" : "expected", weightKg: 2.4 + index * 0.7, destination: index < 8 ? "Paris" : "Marseille", photoCount: index % 4,
  })),
  vehicle: {
    id: "veh-001", plate: "DK-7821-AC", model: "Mercedes Sprinter 319", type: "van", capacityKg: 1200, loadKg: 286.4,
    mileageKm: 84216, fuelPercent: 68, fuelConsumptionL100Km: 10.8, status: "ready", nextMaintenanceKm: 87500,
    inspectionItems: [
      { label: "Pneumatiques", ok: true }, { label: "Freinage", ok: true }, { label: "Éclairage", ok: true },
      { label: "Extincteur", ok: true }, { label: "Scellés compartiment", ok: true }, { label: "Niveau AdBlue", ok: false },
    ],
  },
  incidents: [
    { id: "inc-1", type: "quantity_mismatch", title: "Écart de 3 colis au Relais Parcelles", severity: "high", status: "investigating", at: at(-8), missionCode: "COL-DKR-260718-01" },
    { id: "inc-2", type: "traffic", title: "Ralentissement sur la N1", severity: "medium", status: "open", at: at(-22), missionCode: "COL-DKR-260718-01" },
    { id: "inc-3", type: "seal", title: "Scellé remplacé et photographié", severity: "low", status: "resolved", at: at(-1320), missionCode: "COL-DKR-260718-03" },
  ],
  events: [
    { id: "evt-1", at: at(-5), action: "gps_ping", actor: "Ibrahima Diagne", entity: "COL-DKR-260718-01", detail: "Position transmise avec précision 7 m" },
    { id: "evt-2", at: at(-14), action: "stop_arrival", actor: "Ibrahima Diagne", entity: "Relais Parcelles", detail: "Arrivée géolocalisée validée" },
    { id: "evt-3", at: at(-42), action: "manifest_signed", actor: "Aminata Cissé", entity: "Relais Liberté 6", detail: "12 colis et 2 lots remis" },
    { id: "evt-4", at: at(-65), action: "truck_loaded", actor: "Ibrahima Diagne", entity: "DK-7821-AC", detail: "14 colis scannés et chargés" },
  ],
  notifications: [
    { id: "n-1", title: "Écart de quantité", message: "Trois colis restent à identifier au Relais Parcelles.", at: at(-7), read: false },
    { id: "n-2", title: "Itinéraire recalculé", message: "7 minutes gagnées en évitant l’axe Patte d’Oie.", at: at(-19), read: false },
    { id: "n-3", title: "Maintenance préventive", message: "Révision prévue dans 3 284 km.", at: at(-180), read: true },
  ],
  messages: [
    { id: "m-1", sender: "Fatou — Dispatch", message: "Confirme l’écart avant fermeture du relais.", at: at(-6) },
    { id: "m-2", sender: "Ibrahima", message: "Contrôle physique en cours avec l’agent relais.", at: at(-4) },
  ],
  gps: { position: { lat: 14.7643, lng: -17.4324, label: "Parcelles Assainies" }, speedKph: 0, accuracyMeters: 7, updatedAt: at(-1) },
  sync: { pending: 2, lastSyncedAt: at(-3), online: true },
};

export function getCollectionState(): CollectionState { return structuredClone(state); }
