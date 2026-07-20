import { notFound } from "next/navigation";
import { AuditPage, CommandDashboard, DirectionPage, MissionDetailPage, MissionsPage, TeamsPage, WorkflowsPage } from "@admin-app/src/components/command-pages";
import { loadCommandData, loadMissionDetail } from "@admin-app/src/lib/admin-data";
import { requireAdminSession } from "@admin-app/src/lib/auth";
import { visibleDirectionsForRoles } from "@admin-app/src/lib/governance-catalog";
import { canManageMissions } from "@admin-app/src/lib/governance-catalog";

export const dynamic = "force-dynamic";

export default async function CommandPage({ params }: { params: Promise<{ segments?: string[] }> }) {
  const { segments = [] } = await params;
  const session = await requireAdminSession(`/command/${segments.join("/")}`);
  const data = await loadCommandData(session);
  if (!segments.length) return <CommandDashboard session={session} data={data} directions={visibleDirectionsForRoles(session.roleIds)} />;
  if (segments[0] === "directions" && segments[1] && segments.length === 2) return <DirectionPage session={session} data={data} slug={segments[1]} />;
  if (segments[0] === "missions" && segments.length === 1) return <MissionsPage session={session} data={data} />;
  if (segments[0] === "missions" && segments[1] && segments.length === 2) {
    const detail = await loadMissionDetail(session, segments[1]);
    if (!detail) notFound();
    return <MissionDetailPage detail={detail} staff={data.staff} canManage={canManageMissions(session.roleIds, detail.mission.serviceId)} />;
  }
  if (segments[0] === "workflows" && segments.length === 1) return <WorkflowsPage session={session} />;
  if (segments[0] === "equipes" && segments.length === 1) return <TeamsPage session={session} data={data} />;
  if (segments[0] === "audit" && segments.length === 1) return <AuditPage audit={data.audit} />;
  notFound();
}
