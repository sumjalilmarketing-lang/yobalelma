export type GovernanceAssignment = {
  id?: string;
  roleId: string;
  directionId: string;
  serviceId: string;
  countryCode?: string;
  regionCode?: string;
  organizationId?: string;
  hubId?: string;
  relayPointId?: string;
  teamId?: string;
  operationalZoneId?: string;
};

export type AdminSession = {
  userId: string;
  email: string;
  name: string;
  roleIds: string[];
  assignments: GovernanceAssignment[];
};

export type MissionSummary = {
  id: string;
  reference: string;
  title: string;
  description: string;
  serviceId: string;
  directionId: string;
  status: string;
  priority: string;
  assigneeName: string | null;
  dueAt: string | null;
  createdAt: string;
};

export type AuditSummary = {
  id: string;
  missionId: string | null;
  action: string;
  actorName: string;
  note: string | null;
  createdAt: string;
};

export type TeamMemberSummary = {
  id: string;
  name: string;
  email: string;
  roleId: string;
  directionId: string;
  serviceId: string;
  countryCode: string;
  regionCode: string | null;
};
