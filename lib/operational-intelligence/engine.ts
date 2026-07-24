import { z } from "zod";
import type { ActorContext, DataPoint, Explanation, Recommendation, Scope, WorkflowStatus } from "./types";

const nowIso = (now: Date) => now.toISOString();
const clamp = (value: number) => Math.max(0, Math.min(100, Math.round(value)));
const safeId = (parts: string[]) => parts.join(":").replaceAll(/[^a-zA-Z0-9:_-]/gu, "_");

export function assessDataQuality(points: DataPoint[], now = new Date()) {
  const rejected = points.filter((point) => point.validation === "rejected");
  const stale = points.filter((point) => now.getTime() - Date.parse(point.observedAt) > point.maximumAgeMinutes * 60_000);
  const missing = points.filter((point) => point.value === null);
  const usable = points.filter((point) => !rejected.includes(point) && !stale.includes(point) && !missing.includes(point));
  const confidence = points.length
    ? clamp(usable.reduce((sum, point) => sum + point.confidence, 0) / points.length)
    : 0;
  return { usable, rejected, stale, missing, confidence, status: confidence >= 75 ? "good" as const : confidence >= 45 ? "degraded" as const : "unavailable" as const };
}

export type RuleDefinition = {
  id: string;
  version: string;
  enabled: boolean;
  description: string;
  fact: string;
  operator: "eq" | "neq" | "gt" | "gte" | "lt" | "lte";
  threshold: number | string | boolean;
  priority: Recommendation["priority"];
  action: string;
  alternatives: string[];
  scopes?: Partial<Scope>[];
  allowedRoles: string[];
  sensitive: boolean;
};

function compare(left: unknown, operator: RuleDefinition["operator"], right: RuleDefinition["threshold"]) {
  if (operator === "eq") return left === right;
  if (operator === "neq") return left !== right;
  if (typeof left !== "number" || typeof right !== "number") return false;
  return operator === "gt" ? left > right : operator === "gte" ? left >= right : operator === "lt" ? left < right : left <= right;
}

function matchesScope(rule: RuleDefinition, scope: Scope) {
  if (!rule.scopes?.length) return true;
  return rule.scopes.some((candidate) => Object.entries(candidate).every(([key, value]) => value === undefined || scope[key as keyof Scope] === value));
}

export function evaluateRules(input: { rules: RuleDefinition[]; facts: Record<string, unknown>; subjectType: string; subjectId: string; scope: Scope; now?: Date }): Recommendation[] {
  const now = input.now ?? new Date();
  return input.rules
    .filter((rule) => rule.enabled && matchesScope(rule, input.scope) && compare(input.facts[rule.fact], rule.operator, rule.threshold))
    .map((rule) => ({
      id: safeId(["rule", rule.id, rule.version, input.subjectId]),
      kind: rule.id,
      priority: rule.priority,
      subjectType: input.subjectType,
      subjectId: input.subjectId,
      title: rule.description,
      action: rule.action,
      alternatives: rule.alternatives,
      expectedImpact: "Réduction du risque opérationnel identifié",
      estimatedCost: null,
      estimatedGain: null,
      expiresAt: new Date(now.getTime() + 30 * 60_000).toISOString(),
      sensitive: rule.sensitive,
      requiresHumanApproval: rule.sensitive,
      allowedRoles: rule.allowedRoles,
      explanation: {
        method: "business_rule",
        summary: `${rule.fact} ${rule.operator} ${String(rule.threshold)}`,
        factors: [{ name: rule.fact, contribution: 100, value: String(input.facts[rule.fact]) }],
        sources: ["operational_facts"],
        missingData: [],
        assumptions: [],
        limitations: ["Une règle détecte une condition; elle ne prédit pas un résultat."],
        confidence: 100,
        observedAt: nowIso(now),
        ruleVersion: rule.version,
      },
    }));
}

export type DelayInput = {
  subjectId: string;
  promisedAt: string;
  baselineEtaMinutes: number;
  remainingDistanceKm: number | null;
  hubLoadPercent: number | null;
  relayLoadPercent: number | null;
  openIncidents: number;
  customsBlocked: boolean;
  gpsAgeMinutes: number | null;
  historicalSamples: number;
  observedAt: string;
};

export function estimateDelay(input: DelayInput, now = new Date()) {
  const missing: string[] = [];
  if (input.remainingDistanceKm === null) missing.push("remaining_distance_km");
  if (input.hubLoadPercent === null) missing.push("hub_load_percent");
  if (input.relayLoadPercent === null) missing.push("relay_load_percent");
  if (input.gpsAgeMinutes === null) missing.push("gps_age_minutes");
  let extraMinutes = input.openIncidents * 12 + (input.customsBlocked ? 180 : 0);
  if ((input.hubLoadPercent ?? 0) >= 90) extraMinutes += 45;
  if ((input.relayLoadPercent ?? 0) >= 90) extraMinutes += 30;
  if ((input.gpsAgeMinutes ?? 0) > 15) extraMinutes += 20;
  const etaMinutes = input.baselineEtaMinutes + extraMinutes;
  const slackMinutes = (Date.parse(input.promisedAt) - now.getTime()) / 60_000;
  const risk = clamp(20 + Math.max(0, etaMinutes - slackMinutes) * 1.5 + input.openIncidents * 8 + (input.customsBlocked ? 35 : 0));
  const confidence = clamp(85 - missing.length * 15 - (input.historicalSamples < 30 ? 20 : 0));
  const explanation: Explanation = {
    method: input.historicalSamples >= 30 ? "statistic" : "heuristic",
    summary: "ETA de base ajustée par incidents, capacité, douane et fraîcheur GPS.",
    factors: [
      { name: "baseline_eta_minutes", contribution: 35, value: input.baselineEtaMinutes },
      { name: "open_incidents", contribution: 20, value: input.openIncidents },
      { name: "customs_blocked", contribution: 25, value: String(input.customsBlocked) },
      { name: "capacity_and_gps", contribution: 20, value: extraMinutes },
    ],
    sources: ["missions", "incidents", "customs_cases", "hub_capacities", "relay_points", "operational_live_positions"],
    missingData: missing,
    assumptions: ["Les pénalités sont additives.", "L’ETA de base est valide."],
    limitations: ["Ce résultat n’est pas un modèle prédictif entraîné.", "Trafic et météo absents ne sont pas inventés."],
    confidence,
    observedAt: input.observedAt,
    modelVersion: "delay-heuristic-1.0.0",
  };
  return { risk, revisedEta: new Date(now.getTime() + etaMinutes * 60_000).toISOString(), marginMinutes: Math.max(15, missing.length * 20 + (input.historicalSamples < 30 ? 30 : 10)), explanation };
}

export function forecastSaturation(input: { entityId: string; current: number; capacity: number; arrivalsPerHour: number; departuresPerHour: number; observedAt: string }) {
  const net = input.arrivalsPerHour - input.departuresPerHour;
  const project = (hours: number) => input.capacity ? clamp((input.current + net * hours) / input.capacity * 100) : 0;
  const currentPercent = input.capacity ? clamp(input.current / input.capacity * 100) : 0;
  const hoursToCritical = net > 0 ? Math.max(0, (input.capacity * .9 - input.current) / net) : null;
  return {
    entityId: input.entityId,
    currentPercent,
    at1h: project(1),
    at6h: project(6),
    at24h: project(24),
    criticalAt: hoursToCritical === null ? null : new Date(Date.parse(input.observedAt) + hoursToCritical * 3_600_000).toISOString(),
    options: ["Réorienter les entrées", "Augmenter temporairement les sorties", "Préparer une équipe supplémentaire"],
    explanation: {
      method: "calculation",
      summary: "Projection linéaire des flux entrants et sortants connus.",
      factors: [{ name: "net_flow_per_hour", contribution: 100, value: net }],
      sources: ["capacity_events"],
      missingData: [],
      assumptions: ["Les débits restent constants sur chaque horizon."],
      limitations: ["La projection ne modélise ni météo ni rupture fournisseur."],
      confidence: input.capacity > 0 ? 75 : 0,
      observedAt: input.observedAt,
      modelVersion: "saturation-linear-1.0.0",
    } satisfies Explanation,
  };
}

export type Movement = { entityId: string; latitude: number; longitude: number; recordedAt: string; scanId?: string; holderId?: string };
export function detectMovementAnomalies(movements: Movement[]) {
  const sorted = [...movements].sort((a, b) => Date.parse(a.recordedAt) - Date.parse(b.recordedAt));
  const anomalies: Array<{ kind: string; score: number; severity: "warning" | "critical"; explanation: Explanation }> = [];
  const scanIds = new Set<string>();
  for (let index = 0; index < sorted.length; index += 1) {
    const current = sorted[index];
    if (current.scanId && scanIds.has(current.scanId)) anomalies.push(anomaly("replayed_scan", 95, current.recordedAt, current.scanId));
    if (current.scanId) scanIds.add(current.scanId);
    const previous = sorted[index - 1];
    if (!previous) continue;
    const hours = (Date.parse(current.recordedAt) - Date.parse(previous.recordedAt)) / 3_600_000;
    const distance = haversineKm(previous.latitude, previous.longitude, current.latitude, current.longitude);
    if (hours > 0 && distance / hours > 180) anomalies.push(anomaly("impossible_speed", clamp(distance / hours / 2), current.recordedAt, `${Math.round(distance / hours)} km/h`));
    if (current.holderId && previous.holderId && current.holderId !== previous.holderId && hours <= 0) anomalies.push(anomaly("double_possession", 100, current.recordedAt, "transferts concurrents"));
  }
  return anomalies;
}

function anomaly(kind: string, score: number, observedAt: string, value: string) {
  return { kind, score, severity: score >= 90 ? "critical" as const : "warning" as const, explanation: { method: "anomaly_detection" as const, summary: `Signal ${kind} détecté par seuil déterministe.`, factors: [{ name: kind, contribution: 100, value }], sources: ["custody_events", "operational_live_positions"], missingData: [], assumptions: [], limitations: ["Le signal doit être confirmé par un humain."], confidence: score, observedAt, modelVersion: "anomaly-rules-1.0.0" } };
}

function haversineKm(aLat: number, aLon: number, bLat: number, bLon: number) {
  const radians = (degree: number) => degree * Math.PI / 180;
  const dLat = radians(bLat - aLat); const dLon = radians(bLon - aLon);
  const value = Math.sin(dLat / 2) ** 2 + Math.cos(radians(aLat)) * Math.cos(radians(bLat)) * Math.sin(dLon / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(value), Math.sqrt(1 - value));
}

export function reliabilityScore(input: { completed: number; onTime: number; incidents: number; proofFailures: number; cancellations: number; compliance: boolean }) {
  const total = Math.max(1, input.completed);
  const weights = { punctuality: 35, success: 25, proof: 15, incidents: 15, compliance: 10 };
  const factors = {
    punctuality: input.onTime / total * 100,
    success: Math.max(0, (input.completed - input.cancellations) / total * 100),
    proof: Math.max(0, 100 - input.proofFailures / total * 100),
    incidents: Math.max(0, 100 - input.incidents / total * 100),
    compliance: input.compliance ? 100 : 0,
  };
  const score = clamp(Object.entries(weights).reduce((sum, [key, weight]) => sum + factors[key as keyof typeof factors] * weight / 100, 0));
  return { score, weights, factors, contestable: true, minimumSampleReached: input.completed >= 20 };
}

export function assessVehicleMaintenance(input: { vehicleId: string; mileageKm: number | null; lastServiceAt: string | null; insuranceValid: boolean | null; technicalInspectionValid: boolean | null; incidentCount: number; now?: Date }) {
  const missing = [
    input.mileageKm === null ? "mileage_km" : null,
    input.lastServiceAt === null ? "last_service_at" : null,
    input.insuranceValid === null ? "insurance_valid" : null,
    input.technicalInspectionValid === null ? "technical_inspection_valid" : null,
  ].filter((value): value is string => value !== null);
  if (missing.length) return { enabled: false as const, risk: null, missingData: missing, recommendation: "Collecter et valider les données de maintenance avant toute estimation." };
  const now = input.now ?? new Date();
  const monthsSinceService = (now.getTime() - Date.parse(input.lastServiceAt!)) / (30 * 86_400_000);
  const risk = clamp(Math.max(0, monthsSinceService - 6) * 5 + input.incidentCount * 10 + (!input.insuranceValid ? 100 : 0) + (!input.technicalInspectionValid ? 100 : 0));
  return { enabled: true as const, risk, missingData: [], recommendation: risk >= 80 ? "Retirer du dispatch et faire contrôler le véhicule." : risk >= 40 ? "Planifier un entretien validé par le gestionnaire de flotte." : "Maintenir le calendrier d’entretien." };
}

export function detectFinancialAnomalies(input: { paymentId: string; amount: number; expectedAmount: number | null; duplicateReferenceCount: number; refundRatio: number | null; observedAt: string }) {
  const signals: string[] = [];
  if (input.duplicateReferenceCount > 1) signals.push("duplicate_reference");
  if (input.expectedAmount !== null && Math.abs(input.amount - input.expectedAmount) > Math.max(100, input.expectedAmount * .05)) signals.push("amount_mismatch");
  if (input.refundRatio !== null && input.refundRatio > .25) signals.push("unusual_refund_ratio");
  return { signals, score: clamp(signals.length * 35), requiresFinanceReview: signals.length > 0, missingData: [input.expectedAmount === null ? "expected_amount" : null, input.refundRatio === null ? "refund_ratio" : null].filter(Boolean), observedAt: input.observedAt };
}

export function assistCustoms(input: { caseId: string; requiredDocuments: string[]; presentDocuments: string[]; declaredValue: number | null; currency: string | null; destinationCountry: string; officialDecision?: string }) {
  const missingDocuments = input.requiredDocuments.filter((document) => !input.presentDocuments.includes(document));
  return {
    missingDocuments,
    blockRisk: missingDocuments.length ? "high" as const : "unknown" as const,
    nextAction: missingDocuments.length ? "Demander les documents officiels manquants." : "Soumettre le dossier à l’agent douanier compétent.",
    limitation: "Assistance documentaire uniquement; ne remplace jamais une décision officielle ni ne déduit un code HS.",
    officialDecision: input.officialDecision ?? null,
    missingData: [input.declaredValue === null ? "declared_value" : null, input.currency === null ? "currency" : null].filter(Boolean),
  };
}

export function recommendCommunication(input: { event: "probable_delay" | "document_required" | "incident" | "available"; consent: boolean; approvedTemplate: boolean; sensitive: boolean; localHour: number; allowedHours: [number, number]; language: string; countryCode: string }) {
  const withinHours = input.localHour >= input.allowedHours[0] && input.localHour < input.allowedHours[1];
  const canQueue = input.consent && input.approvedTemplate && withinHours;
  return { canQueue, requiresHumanApproval: input.sensitive, reason: !input.consent ? "consent_missing" : !input.approvedTemplate ? "template_not_approved" : !withinHours ? "quiet_hours" : "eligible", channelSelected: null, language: input.language, countryCode: input.countryCode };
}

export type SimulationScenario = { kind: "hub_closed" | "relay_closed" | "volume_increase" | "vehicle_outage" | "customs_delay" | "provider_outage" | "network_loss"; magnitude: number };
export function simulate(input: { scenario: SimulationScenario; baseline: { missions: number; customers: number; delayMinutes: number; cost: number; capacityPercent: number } }) {
  const multipliers: Record<SimulationScenario["kind"], { delay: number; cost: number; capacity: number }> = {
    hub_closed: { delay: 1.8, cost: 1.35, capacity: 1.3 },
    relay_closed: { delay: 1.35, cost: 1.2, capacity: 1.2 },
    volume_increase: { delay: 1 + input.scenario.magnitude / 100, cost: 1 + input.scenario.magnitude / 200, capacity: 1 + input.scenario.magnitude / 100 },
    vehicle_outage: { delay: 1.5, cost: 1.4, capacity: 1.1 },
    customs_delay: { delay: 2.2, cost: 1.15, capacity: 1.15 },
    provider_outage: { delay: 1.25, cost: 1.1, capacity: 1 },
    network_loss: { delay: 1.2, cost: 1.05, capacity: 1 },
  };
  const factor = multipliers[input.scenario.kind];
  return {
    readOnly: true as const,
    affectedMissions: Math.ceil(input.baseline.missions * Math.min(1, input.scenario.magnitude / 100 || .5)),
    affectedCustomers: Math.ceil(input.baseline.customers * Math.min(1, input.scenario.magnitude / 100 || .5)),
    projectedDelayMinutes: Math.round(input.baseline.delayMinutes * factor.delay),
    projectedCost: Math.round(input.baseline.cost * factor.cost),
    projectedCapacityPercent: clamp(input.baseline.capacityPercent * factor.capacity),
    continuityPlan: ["Maintenir le workflow manuel", "Geler les actions automatiques sensibles", "Valider humainement tout reroutage"],
    explanation: { method: "simulation" as const, summary: "Scénario contrefactuel déterministe, sans écriture opérationnelle.", factors: [{ name: input.scenario.kind, contribution: 100, value: input.scenario.magnitude }], sources: ["digital_twin_baseline"], missingData: [], assumptions: ["Les multiplicateurs sont des hypothèses de stress."], limitations: ["Ce résultat ne constitue pas une prévision."], confidence: 55, observedAt: new Date().toISOString(), modelVersion: "simulation-stress-1.0.0" },
  };
}

const transitions: Record<WorkflowStatus, WorkflowStatus[]> = { created: ["analysed"], analysed: ["proposed"], proposed: ["pending"], pending: ["approved", "rejected", "modified"], approved: ["executed"], rejected: ["closed"], modified: ["pending"], executed: ["verified"], verified: ["closed"], closed: [] };
export function transitionRecommendation(input: { current: WorkflowStatus; next: WorkflowStatus; recommendation: Recommendation; actor: ActorContext; countryCode: string; justification: string }) {
  if (!transitions[input.current].includes(input.next)) throw new Error("Invalid recommendation transition");
  if (!input.actor.roles.some((role) => input.recommendation.allowedRoles.includes(role))) throw new Error("Forbidden recommendation role");
  if (!input.actor.countryCodes.includes("*") && !input.actor.countryCodes.includes(input.countryCode)) throw new Error("Forbidden country scope");
  if (["approved", "rejected", "modified"].includes(input.next) && input.justification.trim().length < 8) throw new Error("A meaningful justification is required");
  if (input.recommendation.sensitive && input.next === "executed" && input.current !== "approved") throw new Error("Sensitive recommendation requires approval");
  return { status: input.next, actorId: input.actor.actorId, occurredAt: new Date().toISOString(), justification: input.justification };
}

export function guardPrompt(value: string) {
  const normalized = value.normalize("NFKC").toLowerCase();
  const blocked = ["ignore previous", "reveal prompt", "system prompt", "export all", "bypass rls", "dump database", "montre tous les secrets"];
  return { safe: !blocked.some((pattern) => normalized.includes(pattern)), sanitized: value.replaceAll(/[<>]/gu, "").slice(0, 500) };
}

export function runDegradedMode<T>(input: { rules: () => T; advanced?: () => T; advancedAvailable: boolean }) {
  if (!input.advancedAvailable || !input.advanced) return { mode: "degraded" as const, result: input.rules(), recommendationsEnabled: false, manualDispatchEnabled: true };
  try { return { mode: "normal" as const, result: input.advanced(), recommendationsEnabled: true, manualDispatchEnabled: true }; }
  catch { return { mode: "degraded" as const, result: input.rules(), recommendationsEnabled: false, manualDispatchEnabled: true }; }
}

export const feedbackSchema = z.object({
  recommendationId: z.string().min(1),
  outcome: z.enum(["accepted", "rejected", "corrected"]),
  reason: z.string().min(8).max(1000),
  actualGain: z.number().nullable(),
  actualDelayMinutes: z.number().nullable(),
  humanCorrection: z.string().max(2000).nullable(),
});
