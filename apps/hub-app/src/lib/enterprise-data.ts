import "server-only";

import { tryCreateSupabaseServerClient } from "@/lib/supabase/server";
import type { HubSession } from "./types";
import type { EnterpriseHubState, EnterpriseHubSummary } from "./enterprise-types";
import { callSupabaseRpc, fromSupabaseTable } from "./supabase-loose";

type LooseRow = Record<string, unknown>;
const s = (row: LooseRow, key: string, fallback = "") => typeof row[key] === "string" ? row[key] as string : fallback;
const n = (row: LooseRow, key: string, fallback = 0) => typeof row[key] === "number" ? row[key] as number : fallback;

const hubSeeds: Array<Omit<EnterpriseHubSummary, "id">> = [
  { code: "DSS-DAKAR", name: "Yobalelma Hub Dakar", city: "Dakar", country: "Sénégal", countryCode: "SN", timezone: "Africa/Dakar", currency: "XOF", status: "operational", inbound: 18, inventory: 286, batches: 7, incidents: 2, criticalAlerts: 1, storedWeightKg: 6430, storageCapacityKg: 50000, travelerCapacityKg: 940, reservedCapacityKg: 615, latitude: 14.6708, longitude: -17.0733 },
  { code: "CDG-PARIS", name: "Yobalelma Hub Paris", city: "Paris", country: "France", countryCode: "FR", timezone: "Europe/Paris", currency: "EUR", status: "operational", inbound: 24, inventory: 418, batches: 10, incidents: 1, criticalAlerts: 0, storedWeightKg: 9320, storageCapacityKg: 80000, travelerCapacityKg: 1280, reservedCapacityKg: 840, latitude: 49.0097, longitude: 2.5479 },
  { code: "BRU-BRUSSELS", name: "Yobalelma Hub Bruxelles", city: "Bruxelles", country: "Belgique", countryCode: "BE", timezone: "Europe/Brussels", currency: "EUR", status: "degraded", inbound: 9, inventory: 142, batches: 4, incidents: 3, criticalAlerts: 2, storedWeightKg: 3880, storageCapacityKg: 40000, travelerCapacityKg: 510, reservedCapacityKg: 435, latitude: 50.9014, longitude: 4.4844 },
  { code: "ABJ-ABIDJAN", name: "Yobalelma Hub Abidjan", city: "Abidjan", country: "Côte d’Ivoire", countryCode: "CI", timezone: "Africa/Abidjan", currency: "XOF", status: "operational", inbound: 13, inventory: 205, batches: 5, incidents: 1, criticalAlerts: 0, storedWeightKg: 5120, storageCapacityKg: 45000, travelerCapacityKg: 680, reservedCapacityKg: 390, latitude: 5.2614, longitude: -3.9263 },
  { code: "CMN-CASABLANCA", name: "Yobalelma Hub Casablanca", city: "Casablanca", country: "Maroc", countryCode: "MA", timezone: "Africa/Casablanca", currency: "MAD", status: "operational", inbound: 11, inventory: 187, batches: 6, incidents: 0, criticalAlerts: 0, storedWeightKg: 4750, storageCapacityKg: 50000, travelerCapacityKg: 720, reservedCapacityKg: 410, latitude: 33.3675, longitude: -7.59 },
  { code: "YUL-MONTREAL", name: "Yobalelma Hub Montréal", city: "Montréal", country: "Canada", countryCode: "CA", timezone: "America/Toronto", currency: "CAD", status: "operational", inbound: 8, inventory: 121, batches: 3, incidents: 1, criticalAlerts: 0, storedWeightKg: 2910, storageCapacityKg: 55000, travelerCapacityKg: 460, reservedCapacityKg: 280, latitude: 45.4706, longitude: -73.7408 },
];

export function createEnterpriseDemoState(session: HubSession): EnterpriseHubState {
  const allHubs = hubSeeds.map((hub, index) => ({ ...hub, id: index === 0 ? "hub-dss" : `hub-${hub.code.toLowerCase()}` }));
  const hubs = session.role === "hub_agent" || session.role === "hub_supervisor" ? allHubs.filter((hub) => hub.id === session.hubId) : allHubs;
  const now = new Date();
  const day = now.toISOString().slice(0, 10);
  const agentNames = ["Awa Diop", "Mamadou Sarr", "Fatou Ndiaye", "Jean Morel", "Sophie Lambert", "Yacine El Amrani"];
  return {
    generatedAt: now.toISOString(), source: "demo", activeHubId: session.hubId, hubs,
    agents: agentNames.map((name, index) => ({ id: `agent-${index + 1}`, name, hubCode: allHubs[index % allHubs.length].code, team: index % 2 ? "Outbound" : "Inbound", station: index % 3 ? "Inspection" : "Réception", received: 42 + index * 7, inspections: 31 + index * 5, movements: 54 + index * 8, batches: 2 + index, errors: index % 3, resolvedIncidents: 1 + index % 2, processedWeightKg: 380 + index * 92, averageSeconds: 84 - index * 4, slaPercent: 91 + index, productivity: 78 + index * 3 })),
    alerts: [
      { id: "alert-1", hubCode: "BRU-BRUSSELS", title: "Capacité proche du seuil", message: "Les réservations atteignent 85 % de la capacité voyageur.", severity: "critical", status: "open", triggeredAt: now.toISOString(), slaDueAt: new Date(now.getTime() + 30 * 60_000).toISOString() },
      { id: "alert-2", hubCode: "DSS-DAKAR", title: "Stock dormant", message: "12 colis sont sans mouvement depuis plus de 48 heures.", severity: "high", status: "acknowledged", triggeredAt: new Date(now.getTime() - 75 * 60_000).toISOString() },
      { id: "alert-3", hubCode: "CDG-PARIS", title: "Manifeste incomplet", message: "Le manifeste REC-CDG-204 attend encore 3 colis.", severity: "warning", status: "open", triggeredAt: new Date(now.getTime() - 25 * 60_000).toISOString() },
    ],
    incidents: [
      { id: "incident-1", code: "INC-DSS-1042", hubCode: "DSS-DAKAR", title: "Scanner zone B intermittent", type: "scanner_failure", priority: "high", status: "assigned", assignedTo: "Mamadou Sarr", openedAt: new Date(now.getTime() - 48 * 60_000).toISOString(), slaMinutes: 120 },
      { id: "incident-2", code: "INC-BRU-2088", hubCode: "BRU-BRUSSELS", title: "Écart inventaire étagère C4", type: "stock_error", priority: "urgent", status: "escalated", assignedTo: "Sophie Lambert", openedAt: new Date(now.getTime() - 95 * 60_000).toISOString(), slaMinutes: 90 },
      { id: "incident-3", code: "INC-CDG-3091", hubCode: "CDG-PARIS", title: "Colis endommagé à réception", type: "damaged_package", priority: "medium", status: "open", assignedTo: "Non assigné", openedAt: new Date(now.getTime() - 22 * 60_000).toISOString(), slaMinutes: 180 },
    ],
    forecasts: allHubs.slice(0, 3).flatMap((hub, hubIndex) => [1, 2, 3, 4, 5, 6, 7].map((offset) => ({ hubCode: hub.code, date: new Date(now.getTime() + offset * 86_400_000).toISOString().slice(0, 10), expectedPackages: 310 + hubIndex * 90 + offset * 18, expectedWeightKg: 1480 + hubIndex * 410 + offset * 85, travelerCapacityKg: 620 + hubIndex * 180 + offset * 25, recommendedAgents: 14 + hubIndex * 4 + Math.ceil(offset / 2), recommendedLocations: 38 + hubIndex * 12 + offset, saturationRisk: 34 + hubIndex * 16 + offset * 3, delayRisk: 18 + hubIndex * 11 + offset * 2 }))),
    audit: ["inbound.confirm", "inspection.decide", "inventory.move", "batch.reserve", "export.create", "incident.escalate"].map((action, index) => ({ id: `audit-${index + 1}`, actor: agentNames[index], role: index === 1 ? "hub_supervisor" : "hub_agent", hubCode: allHubs[index % 3].code, action, resource: `${action.split(".")[0]}-${1040 + index}`, result: "success", risk: index > 3 ? "medium" : "low", occurredAt: new Date(now.getTime() - index * 18 * 60_000).toISOString(), correlationId: `hub-${day}-${String(index + 1).padStart(4, "0")}` })),
    health: { api: "operational", auth: "operational", database: "operational", realtime: "operational", scanner: "operational", storage: "operational", latencyMs: 86, availabilityPercent: 99.97, version: process.env.NEXT_PUBLIC_APP_VERSION ?? "enterprise-1.0.0" },
  };
}

function createUnavailableState(session: HubSession, latencyMs = 0): EnterpriseHubState {
  return { generatedAt: new Date().toISOString(), source: "unavailable", activeHubId: session.hubId, hubs: [], agents: [], alerts: [], incidents: [], forecasts: [], audit: [], health: { api: "degraded", auth: "degraded", database: "degraded", realtime: "degraded", scanner: "degraded", storage: "degraded", latencyMs, availabilityPercent: 0, version: process.env.NEXT_PUBLIC_APP_VERSION ?? "unknown" } };
}

export async function loadEnterpriseHubState(session: HubSession): Promise<EnterpriseHubState> {
  if (session.source !== "supabase" || !session.userId) return process.env.NODE_ENV !== "production" ? createEnterpriseDemoState(session) : createUnavailableState(session);
  const client = await tryCreateSupabaseServerClient();
  if (!client) return createUnavailableState(session);
  const started = Date.now();
  const base = createUnavailableState(session);
  try {
    const [{ data: tower, error }, hubsResult, alertsResult, incidentsResult, performanceResult, forecastResult, auditResult, profilesResult] = await Promise.all([
      callSupabaseRpc<LooseRow[]>(client, "get_hub_control_tower", { p_hub_id: null }),
      fromSupabaseTable(client, "airport_hubs").select<LooseRow>("id,code,name,city,country,country_code,timezone,currency_code,status,latitude,longitude"),
      fromSupabaseTable(client, "hub_alerts").select<LooseRow>("id,hub_id,title,message,severity,status,triggered_at,sla_due_at").order("triggered_at", { ascending: false }).limit(50),
      fromSupabaseTable(client, "operational_incidents").select<LooseRow>("id,incident_code,hub_id,title,incident_type,priority,status,assigned_to,created_at").order("created_at", { ascending: false }).limit(50),
      fromSupabaseTable(client, "hub_agent_performance").select<LooseRow>("id,profile_id,hub_id,received_packages,completed_inspections,stock_movements,prepared_batches,operation_errors,resolved_incidents,processed_weight_kg,average_operation_seconds,sla_compliance_percent,metadata").limit(100),
      fromSupabaseTable(client, "hub_forecast_snapshots").select<LooseRow>("hub_id,forecast_date,expected_packages,expected_weight_kg,expected_traveler_capacity_kg,recommended_agent_count,recommended_storage_locations,saturation_risk_percent,delay_risk_percent").order("forecast_date").limit(100),
      fromSupabaseTable(client, "hub_audit_events").select<LooseRow>("id,actor_id,actor_role,hub_id,action,resource_type,resource_id,result,risk_level,occurred_at,correlation_id").order("occurred_at", { ascending: false }).limit(100),
      fromSupabaseTable(client, "profiles").select<LooseRow>("id,full_name"),
    ]);
    if (error || !Array.isArray(tower) || tower.length === 0) throw new Error(error?.message ?? "empty control tower");
    const metadata = new Map((hubsResult.data ?? []).map((row: LooseRow) => [s(row, "id"), row]));
    const towerRows = tower as LooseRow[];
    const hubs: EnterpriseHubSummary[] = towerRows.map((row) => {
      const extra: LooseRow = metadata.get(s(row, "hub_id")) ?? {};
      return { id: s(row, "hub_id"), code: s(row, "hub_code"), name: s(row, "hub_name"), city: s(row, "city"), country: s(row, "country"), countryCode: s(extra, "country_code"), timezone: s(extra, "timezone"), currency: s(extra, "currency_code"), status: s(row, "status", "operational") as EnterpriseHubSummary["status"], inbound: n(row, "inbound_count"), inventory: n(row, "inventory_count"), batches: n(row, "active_batches"), incidents: n(row, "open_incidents"), criticalAlerts: n(row, "critical_alerts"), storedWeightKg: n(row, "stored_weight_kg"), storageCapacityKg: n(row, "storage_capacity_kg"), travelerCapacityKg: n(row, "traveler_capacity_kg"), reservedCapacityKg: n(row, "reserved_capacity_kg"), latitude: n(extra, "latitude"), longitude: n(extra, "longitude") };
    });
    const hubCodes = new Map(hubs.map((hub) => [hub.id, hub.code]));
    const profileNames = new Map((profilesResult.data ?? []).map((row: LooseRow) => [s(row, "id"), s(row, "full_name", "Collaborateur")]));
    return {
      ...base, source: "supabase", generatedAt: new Date().toISOString(), hubs,
      alerts: (alertsResult.data ?? []).map((row: LooseRow) => ({ id: s(row, "id"), hubCode: hubCodes.get(s(row, "hub_id")) ?? "—", title: s(row, "title"), message: s(row, "message"), severity: s(row, "severity", "info") as EnterpriseHubState["alerts"][number]["severity"], status: s(row, "status", "open") as EnterpriseHubState["alerts"][number]["status"], triggeredAt: s(row, "triggered_at"), slaDueAt: s(row, "sla_due_at") || undefined })),
      incidents: (incidentsResult.data ?? []).map((row: LooseRow) => ({ id: s(row, "id"), code: s(row, "incident_code"), hubCode: hubCodes.get(s(row, "hub_id")) ?? "—", title: s(row, "title"), type: s(row, "incident_type"), priority: s(row, "priority"), status: s(row, "status"), assignedTo: s(row, "assigned_to", "Non assigné"), openedAt: s(row, "created_at"), slaMinutes: 0 })),
      agents: (performanceResult.data ?? []).map((row: LooseRow) => ({ id: s(row, "id"), name: profileNames.get(s(row, "profile_id")) ?? "Collaborateur", hubCode: hubCodes.get(s(row, "hub_id")) ?? "—", team: "Operations", station: "Hub", received: n(row, "received_packages"), inspections: n(row, "completed_inspections"), movements: n(row, "stock_movements"), batches: n(row, "prepared_batches"), errors: n(row, "operation_errors"), resolvedIncidents: n(row, "resolved_incidents"), processedWeightKg: n(row, "processed_weight_kg"), averageSeconds: n(row, "average_operation_seconds"), slaPercent: n(row, "sla_compliance_percent"), productivity: Math.max(0, Math.min(100, Math.round(n(row, "sla_compliance_percent") - n(row, "operation_errors") * 2))) })),
      forecasts: (forecastResult.data ?? []).map((row: LooseRow) => ({ hubCode: hubCodes.get(s(row, "hub_id")) ?? "—", date: s(row, "forecast_date"), expectedPackages: n(row, "expected_packages"), expectedWeightKg: n(row, "expected_weight_kg"), travelerCapacityKg: n(row, "expected_traveler_capacity_kg"), recommendedAgents: n(row, "recommended_agent_count"), recommendedLocations: n(row, "recommended_storage_locations"), saturationRisk: n(row, "saturation_risk_percent"), delayRisk: n(row, "delay_risk_percent") })),
      audit: (auditResult.data ?? []).map((row: LooseRow) => ({ id: s(row, "id"), actor: s(row, "actor_id", "Système"), role: s(row, "actor_role"), hubCode: hubCodes.get(s(row, "hub_id")) ?? "—", action: s(row, "action"), resource: `${s(row, "resource_type")}:${s(row, "resource_id")}`, result: s(row, "result"), risk: s(row, "risk_level"), occurredAt: s(row, "occurred_at"), correlationId: s(row, "correlation_id") })),
      health: { ...base.health, api: "operational", auth: "operational", database: "operational", realtime: "operational", storage: "operational", latencyMs: Date.now() - started },
    };
  } catch {
    return createUnavailableState(session, Date.now() - started);
  }
}
