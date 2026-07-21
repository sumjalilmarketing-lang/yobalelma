const statusLabels: Record<string, string> = {
  active: "Actif",
  approved: "Validé",
  assigned: "Attribué",
  cancelled: "Annulé",
  closed: "Clôturé",
  confirmed: "Confirmé",
  delivered: "Livré",
  draft: "Brouillon",
  failed: "À vérifier",
  in_progress: "En cours",
  matched: "Affecté",
  matching: "Recherche en cours",
  offered: "Proposé",
  open: "Ouvert",
  paid: "Payé",
  pending: "En attente",
  planned: "Planifié",
  rejected: "Refusé",
  requested: "Demandé",
  requires_confirmation: "Confirmation requise",
  submitted: "Transmis",
  suspended: "Suspendu",
};

export function toBusinessStatusLabel(status: string | null | undefined) {
  if (!status) return "À confirmer";
  return statusLabels[status] ?? "Mise à jour disponible";
}
