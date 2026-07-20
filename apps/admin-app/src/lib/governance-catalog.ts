export type GovernanceLevel = "executive" | "manager" | "supervisor" | "agent" | "specialist" | "auditor";

export type GovernanceRole = {
  id: string;
  label: string;
  directionId: string;
  serviceId: string;
  level: GovernanceLevel;
};

export type GovernanceService = {
  id: string;
  label: string;
  directionId: string;
  missionLabel: string;
};

export type GovernanceDirection = {
  id: string;
  slug: string;
  label: string;
  shortLabel: string;
  description: string;
  color: string;
};

export const governanceDirections = [
  { id: "executive", slug: "direction-generale", label: "Direction générale", shortLabel: "Gouvernance", description: "Gouvernance de la plateforme, arbitrages et contrôle global.", color: "#ff6600" },
  { id: "operations", slug: "operations", label: "Direction des opérations", shortLabel: "Opérations", description: "Orchestration des hubs, relais, collectes, dispatch et livraisons locales.", color: "#166534" },
  { id: "travelers", slug: "voyageurs", label: "Direction voyageurs", shortLabel: "Voyageurs", description: "Validation, accompagnement et qualité du réseau voyageurs.", color: "#2563eb" },
  { id: "customs", slug: "douane-conformite", label: "Direction douane & conformité", shortLabel: "Conformité", description: "Contrôles douaniers, conformité réglementaire et décisions documentées.", color: "#7c3aed" },
  { id: "finance", slug: "finance", label: "Direction finance", shortLabel: "Finance", description: "Paiements, rapprochements, commissions, remboursements et clôtures.", color: "#0f766e" },
  { id: "customer_service", slug: "service-client", label: "Direction service client", shortLabel: "Service client", description: "Assistance, litiges, réclamations et satisfaction client.", color: "#c2410c" },
  { id: "security", slug: "securite", label: "Direction sécurité", shortLabel: "Sécurité", description: "Maîtrise des risques, contrôles internes et audits indépendants.", color: "#b91c1c" },
  { id: "partners", slug: "partenaires", label: "Direction partenaires", shortLabel: "Partenaires", description: "Pilotage des partenaires, points relais, transporteurs et compagnies aériennes.", color: "#0369a1" },
] as const satisfies readonly GovernanceDirection[];

export const governanceServices = [
  service("platform_governance", "Administration plateforme", "executive", "Gouvernance plateforme"),
  service("central_operations", "Pilotage opérationnel", "operations", "Mission opérationnelle"),
  service("hub_operations", "Opérations Hub", "operations", "Mission Hub"),
  service("relay_operations", "Opérations points relais", "operations", "Mission point relais"),
  service("collection_operations", "Collectes", "operations", "Mission de collecte"),
  service("dispatch", "Dispatch", "operations", "Mission de dispatch"),
  service("local_delivery", "Livraison locale", "operations", "Mission de livraison"),
  service("traveler_management", "Gestion voyageurs", "travelers", "Mission voyageur"),
  service("traveler_validation", "Validation voyageurs", "travelers", "Dossier de validation"),
  service("traveler_support", "Support voyageurs", "travelers", "Mission d’assistance voyageur"),
  service("customs_operations", "Opérations douanières", "customs", "Contrôle douanier"),
  service("compliance", "Conformité", "customs", "Revue de conformité"),
  service("finance_control", "Pilotage financier", "finance", "Mission financière"),
  service("accounting", "Comptabilité", "finance", "Écriture comptable"),
  service("reconciliation", "Rapprochements", "finance", "Rapprochement"),
  service("payments", "Paiements", "finance", "Contrôle de paiement"),
  service("commissions", "Commissions", "finance", "Contrôle de commission"),
  service("refunds", "Remboursements", "finance", "Demande de remboursement"),
  service("customer_support", "Service client", "customer_service", "Dossier client"),
  service("security_control", "Sécurité", "security", "Contrôle de sécurité"),
  service("internal_audit", "Audit interne", "security", "Mission d’audit"),
  service("partner_management", "Pilotage partenaires", "partners", "Mission partenaire"),
  service("orange_partnership", "Partenariat Orange", "partners", "Mission Orange"),
  service("relay_partnership", "Réseau points relais", "partners", "Mission réseau relais"),
  service("carrier_partnership", "Transporteurs", "partners", "Mission transporteur"),
  service("airline_partnership", "Compagnies aériennes", "partners", "Mission compagnie aérienne"),
] as const satisfies readonly GovernanceService[];

export const governanceRoles = [
  role("super_admin", "Super Admin", "executive", "platform_governance", "executive"),
  role("admin", "Administrateur plateforme", "executive", "platform_governance", "executive"),
  role("operations_manager", "Responsable des opérations", "operations", "central_operations", "manager"),
  role("hub_manager", "Responsable Hub", "operations", "hub_operations", "manager"),
  role("hub_supervisor", "Superviseur Hub", "operations", "hub_operations", "supervisor"),
  role("hub_agent", "Agent Hub", "operations", "hub_operations", "agent"),
  role("relay_manager", "Responsable points relais", "operations", "relay_operations", "manager"),
  role("relay_agent", "Agent point relais", "operations", "relay_operations", "agent"),
  role("collection_manager", "Responsable collecte", "operations", "collection_operations", "manager"),
  role("collection_supervisor", "Superviseur collecte", "operations", "collection_operations", "supervisor"),
  role("collection_driver", "Agent de collecte", "operations", "collection_operations", "agent"),
  role("dispatch_manager", "Responsable dispatch", "operations", "dispatch", "manager"),
  role("local_delivery_manager", "Responsable livraison locale", "operations", "local_delivery", "manager"),
  role("traveler_manager", "Responsable voyageurs", "travelers", "traveler_management", "manager"),
  role("traveler_validation", "Chargé de validation voyageurs", "travelers", "traveler_validation", "specialist"),
  role("traveler_support", "Chargé de support voyageurs", "travelers", "traveler_support", "agent"),
  role("customs_manager", "Responsable douane", "customs", "customs_operations", "manager"),
  role("customs_agent", "Agent douane", "customs", "customs_operations", "agent"),
  role("compliance_manager", "Responsable conformité", "customs", "compliance", "manager"),
  role("compliance_agent", "Chargé de conformité", "customs", "compliance", "specialist"),
  role("finance_manager", "Responsable finance", "finance", "finance_control", "manager"),
  role("finance_agent", "Chargé finance", "finance", "finance_control", "agent"),
  role("accounting_agent", "Comptable", "finance", "accounting", "specialist"),
  role("reconciliation_agent", "Chargé des rapprochements", "finance", "reconciliation", "specialist"),
  role("payment_agent", "Chargé des paiements", "finance", "payments", "specialist"),
  role("commission_agent", "Chargé des commissions", "finance", "commissions", "specialist"),
  role("refund_agent", "Chargé des remboursements", "finance", "refunds", "specialist"),
  role("customer_support_manager", "Responsable service client", "customer_service", "customer_support", "manager"),
  role("customer_support_agent", "Conseiller service client", "customer_service", "customer_support", "agent"),
  role("support_agent", "Conseiller service client", "customer_service", "customer_support", "agent"),
  role("security_manager", "Responsable sécurité", "security", "security_control", "manager"),
  role("auditor", "Auditeur", "security", "internal_audit", "auditor"),
  role("partner_manager", "Responsable partenaires", "partners", "partner_management", "manager"),
  role("orange_partner_manager", "Responsable partenariat Orange", "partners", "orange_partnership", "manager"),
  role("relay_partner_manager", "Responsable réseau points relais", "partners", "relay_partnership", "manager"),
  role("carrier_partner_manager", "Responsable transporteurs", "partners", "carrier_partnership", "manager"),
  role("airline_partner_manager", "Responsable compagnies aériennes", "partners", "airline_partnership", "manager"),
] as const satisfies readonly GovernanceRole[];

export type GovernanceRoleId = (typeof governanceRoles)[number]["id"];

export function getGovernanceRole(id: string) {
  return governanceRoles.find((item) => item.id === id) ?? null;
}

export function getGovernanceService(id: string) {
  return governanceServices.find((item) => item.id === id) ?? null;
}

export function getGovernanceDirectionBySlug(slug: string) {
  return governanceDirections.find((item) => item.slug === slug) ?? null;
}

export function rolesForService(serviceId: string) {
  return governanceRoles.filter((item) => item.serviceId === serviceId);
}

export function servicesForDirection(directionId: string) {
  return governanceServices.filter((item) => item.directionId === directionId);
}

export function visibleDirectionsForRoles(roleIds: readonly string[]) {
  if (roleIds.some((id) => id === "super_admin" || id === "admin")) return [...governanceDirections];
  const allowed = new Set(roleIds.map(getGovernanceRole).filter(Boolean).map((item) => item!.directionId));
  return governanceDirections.filter((item) => allowed.has(item.id));
}

export function canManageMissions(roleIds: readonly string[], serviceId?: string) {
  return roleIds.some((id) => {
    const item = getGovernanceRole(id);
    if (!item) return false;
    if (item.level === "executive") return true;
    return item.level === "manager" && (!serviceId || item.serviceId === serviceId || item.id === "operations_manager");
  });
}

function directionForService(serviceId: string) {
  const item = governanceServices.find((candidate) => candidate.id === serviceId);
  if (!item) throw new Error(`Unknown governance service: ${serviceId}`);
  return item.directionId;
}

function service(id: string, label: string, directionId: string, missionLabel: string): GovernanceService {
  return { id, label, directionId, missionLabel };
}

function role(id: string, label: string, directionId: string, serviceId: string, level: GovernanceLevel): GovernanceRole {
  if (directionForService(serviceId) !== directionId) throw new Error(`Role ${id} is attached to an invalid service.`);
  return { id, label, directionId, serviceId, level };
}
