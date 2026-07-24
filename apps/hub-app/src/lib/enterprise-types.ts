export type EnterpriseHubSummary = {
  id: string;
  code: string;
  name: string;
  city: string;
  country: string;
  countryCode: string;
  timezone: string;
  currency: string;
  status: "operational" | "degraded" | "paused" | "maintenance" | "closed";
  inbound: number;
  inventory: number;
  batches: number;
  incidents: number;
  criticalAlerts: number;
  storedWeightKg: number;
  storageCapacityKg: number;
  travelerCapacityKg: number;
  reservedCapacityKg: number;
  latitude: number;
  longitude: number;
};

export type EnterpriseAgentMetric = {
  id: string;
  name: string;
  hubCode: string;
  team: string;
  station: string;
  received: number;
  inspections: number;
  movements: number;
  batches: number;
  errors: number;
  resolvedIncidents: number;
  processedWeightKg: number;
  averageSeconds: number;
  slaPercent: number;
  productivity: number;
};

export type EnterpriseAlert = {
  id: string;
  hubCode: string;
  title: string;
  message: string;
  severity: "info" | "warning" | "high" | "critical";
  status: "open" | "acknowledged" | "resolved" | "suppressed";
  triggeredAt: string;
  slaDueAt?: string;
};

export type EnterpriseIncident = {
  id: string;
  code: string;
  hubCode: string;
  title: string;
  type: string;
  priority: string;
  status: string;
  assignedTo: string;
  openedAt: string;
  slaMinutes: number;
};

export type EnterpriseForecast = {
  hubCode: string;
  date: string;
  expectedPackages: number;
  expectedWeightKg: number;
  travelerCapacityKg: number;
  recommendedAgents: number;
  recommendedLocations: number;
  saturationRisk: number;
  delayRisk: number;
};

export type EnterpriseAuditEvent = {
  id: string;
  actor: string;
  role: string;
  hubCode: string;
  action: string;
  resource: string;
  result: string;
  risk: string;
  occurredAt: string;
  correlationId: string;
};

export type EnterpriseHubState = {
  generatedAt: string;
  source: "demo" | "supabase" | "unavailable";
  activeHubId: string;
  hubs: EnterpriseHubSummary[];
  agents: EnterpriseAgentMetric[];
  alerts: EnterpriseAlert[];
  incidents: EnterpriseIncident[];
  forecasts: EnterpriseForecast[];
  audit: EnterpriseAuditEvent[];
  health: {
    api: "operational" | "degraded";
    auth: "operational" | "degraded";
    database: "operational" | "degraded";
    realtime: "operational" | "degraded";
    scanner: "operational" | "degraded";
    storage: "operational" | "degraded";
    latencyMs: number;
    availabilityPercent: number;
    version: string;
  };
};
