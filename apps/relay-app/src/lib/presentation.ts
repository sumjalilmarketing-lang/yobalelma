import type { RelayPackageStatus, RelayRole, StorageLocation } from "./types";

export const relayRoleLabel: Record<RelayRole, string> = {
  relay_agent: "Agent du point relais",
  relay_manager: "Responsable du point relais",
  operations_manager: "Responsable des opérations",
};

export const packageStatusLabel: Record<RelayPackageStatus, string> = {
  expected: "Arrivée attendue",
  received: "Réceptionné",
  controlled: "Contrôlé",
  stored: "Rangé",
  awaiting_carrier: "Prêt pour le transporteur",
  awaiting_recipient: "Prêt pour le destinataire",
  handed_over: "Remis",
  refused: "Refusé",
  anomaly: "À vérifier",
};

export const locationKindLabel: Record<StorageLocation["kind"], string> = {
  shelf: "Rayonnage",
  locker: "Casier",
  secure_cage: "Zone sécurisée",
  oversize: "Hors gabarit",
};

export const eventActionLabel: Record<string, string> = {
  package_scanned: "Colis enregistré",
  location_assigned: "Emplacement attribué",
  otp_verified: "Identité confirmée",
  batch_handover: "Lot remis",
  check_in: "Entrée enregistrée",
  check_out: "Sortie enregistrée",
  handover: "Remise enregistrée",
  exception: "Vérification demandée",
};

export const incidentSeverityLabel = { low: "Faible", medium: "Modérée", high: "Élevée" } as const;
export const incidentStatusLabel = { open: "À traiter", investigating: "En cours", resolved: "Résolu" } as const;

export function professionalError(error: unknown, fallback = "L’opération n’a pas pu aboutir. Réessayez dans quelques instants.") {
  const message = error instanceof Error ? error.message : typeof error === "string" ? error : "";
  const normalized = message.toLowerCase();
  if (normalized.includes("auth") || normalized.includes("credential") || normalized.includes("password")) return "Les informations de connexion sont incorrectes.";
  if (normalized.includes("otp")) return "Le code de sécurité est incorrect ou a expiré.";
  if (normalized.includes("not found") || normalized.includes("introuvable")) return "Ce colis n’a pas été trouvé. Vérifiez sa référence.";
  if (normalized.includes("access") || normalized.includes("permission") || normalized.includes("role")) return "Votre profil ne permet pas cette opération.";
  if (normalized.includes("network") || normalized.includes("fetch") || normalized.includes("supabase") || normalized.includes("database")) return "Le service Yobalelma est momentanément indisponible.";
  return fallback;
}
