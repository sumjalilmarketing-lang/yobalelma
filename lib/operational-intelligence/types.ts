export type IntelligenceMethod =
  | "business_rule"
  | "heuristic"
  | "calculation"
  | "statistic"
  | "predictive_model"
  | "simulation"
  | "anomaly_detection";

export type DataPoint = {
  key: string;
  value: number | string | boolean | null;
  source: string;
  observedAt: string;
  owner: string;
  validation: "validated" | "unverified" | "rejected";
  confidence: number;
  maximumAgeMinutes: number;
};

export type Scope = {
  countryCode: string;
  city?: string;
  partnerId?: string;
  parcelType?: string;
  riskLevel?: string;
};

export type Explanation = {
  method: IntelligenceMethod;
  summary: string;
  factors: Array<{ name: string; contribution: number; value: number | string }>;
  sources: string[];
  missingData: string[];
  assumptions: string[];
  limitations: string[];
  confidence: number;
  observedAt: string;
  ruleVersion?: string;
  modelVersion?: string;
};

export type Recommendation = {
  id: string;
  kind: string;
  priority: "low" | "medium" | "high" | "critical";
  subjectType: string;
  subjectId: string;
  title: string;
  action: string;
  alternatives: string[];
  expectedImpact: string;
  estimatedCost: number | null;
  estimatedGain: number | null;
  expiresAt: string;
  sensitive: boolean;
  requiresHumanApproval: boolean;
  allowedRoles: string[];
  explanation: Explanation;
};

export type WorkflowStatus =
  | "created"
  | "analysed"
  | "proposed"
  | "pending"
  | "approved"
  | "rejected"
  | "modified"
  | "executed"
  | "verified"
  | "closed";

export type ActorContext = {
  actorId: string;
  roles: string[];
  countryCodes: string[];
  partnerIds?: string[];
};
