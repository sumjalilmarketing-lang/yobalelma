import { z } from "zod";
import { governanceDirections, rolesForService } from "./governance-catalog";

export const missionPrioritySchema = z.enum(["low", "normal", "high", "critical"]);
export const missionStatusSchema = z.enum(["draft", "assigned", "in_progress", "awaiting_validation", "correction_required", "validated", "closed", "cancelled"]);
export type MissionStatus = z.infer<typeof missionStatusSchema>;

export const workflowStepSchema = z.object({
  key: z.string().min(2).max(80),
  label: z.string().min(2).max(140),
  ownerRoleIds: z.array(z.string().min(2)).min(1),
  slaMinutes: z.number().int().positive(),
  proofTypes: z.array(z.string().min(2)).default([]),
  requiredValidation: z.boolean().default(false),
});

export const workflowDefinitionSchema = z.object({
  key: z.string().min(2).max(80),
  label: z.string().min(2).max(140),
  directionId: z.string().min(2),
  serviceId: z.string().min(2),
  version: z.number().int().positive(),
  steps: z.array(workflowStepSchema).min(2),
});

export const missionCreateSchema = z.object({
  title: z.string().trim().min(4).max(180),
  description: z.string().trim().min(8).max(3000),
  workflowKey: z.string().min(2).max(80),
  serviceId: z.string().min(2).max(80),
  priority: missionPrioritySchema.default("normal"),
  assigneeId: z.string().uuid().optional(),
  dueAt: z.string().datetime().optional(),
  countryCode: z.string().length(2).default("SN"),
  regionCode: z.string().max(40).optional(),
  organizationId: z.string().uuid().optional(),
  hubId: z.string().uuid().optional(),
  relayPointId: z.string().uuid().optional(),
  teamId: z.string().uuid().optional(),
  operationalZoneId: z.string().uuid().optional(),
});

export const missionTransitionSchema = z.object({
  action: z.enum(["assign", "reassign", "start", "submit", "request_correction", "validate", "close", "cancel"]),
  note: z.string().trim().max(2000).optional(),
  assigneeId: z.string().uuid().optional(),
  proofIds: z.array(z.string().uuid()).default([]),
  proofType: z.string().trim().max(80).optional(),
  proofReference: z.string().trim().max(500).optional(),
});

const transitionTargets = {
  assign: "assigned",
  reassign: "assigned",
  start: "in_progress",
  submit: "awaiting_validation",
  request_correction: "correction_required",
  validate: "validated",
  close: "closed",
  cancel: "cancelled",
} as const satisfies Record<string, MissionStatus>;

const allowedActions: Record<MissionStatus, readonly (keyof typeof transitionTargets)[]> = {
  draft: ["assign", "cancel"],
  assigned: ["reassign", "start", "cancel"],
  in_progress: ["reassign", "submit", "cancel"],
  awaiting_validation: ["request_correction", "validate"],
  correction_required: ["reassign", "start", "submit"],
  validated: ["close"],
  closed: [],
  cancelled: [],
};

export function nextMissionStatus(current: MissionStatus, action: keyof typeof transitionTargets) {
  if (!allowedActions[current].includes(action)) throw new Error("Cette action ne respecte pas le workflow de la mission.");
  return transitionTargets[action];
}

export function calculateSlaState(dueAt: string | null, completedAt: string | null, now = new Date()) {
  if (completedAt) return "completed" as const;
  if (!dueAt) return "on_track" as const;
  const remaining = new Date(dueAt).getTime() - now.getTime();
  if (remaining < 0) return "breached" as const;
  if (remaining < 60 * 60 * 1000) return "at_risk" as const;
  return "on_track" as const;
}

export const defaultWorkflows = governanceDirections.map((direction) => {
  const serviceId = direction.id === "executive" ? "platform_governance" : direction.id === "operations" ? "central_operations" : direction.id === "travelers" ? "traveler_management" : direction.id === "customs" ? "compliance" : direction.id === "finance" ? "finance_control" : direction.id === "customer_service" ? "customer_support" : direction.id === "security" ? "security_control" : "partner_management";
  const roles = rolesForService(serviceId);
  const operators = roles.filter((item) => ["agent", "specialist", "supervisor"].includes(item.level)).map((item) => item.id);
  const managers = roles.filter((item) => ["manager", "executive"].includes(item.level)).map((item) => item.id);
  const ownerRoleIds = operators.length ? operators : managers;
  return {
    key: `${direction.id}_standard`, label: `Workflow ${direction.shortLabel}`, directionId: direction.id, serviceId, version: 1,
    steps: [
      { key: "qualification", label: "Qualification", ownerRoleIds, slaMinutes: 120, proofTypes: [], requiredValidation: false },
      { key: "execution", label: "Exécution", ownerRoleIds, slaMinutes: 480, proofTypes: ["activity_report"], requiredValidation: false },
      { key: "quality_control", label: "Contrôle qualité", ownerRoleIds: managers, slaMinutes: 240, proofTypes: ["quality_check"], requiredValidation: true },
      { key: "closure", label: "Validation et clôture", ownerRoleIds: managers, slaMinutes: 120, proofTypes: ["closure_report"], requiredValidation: true },
    ],
  };
});
