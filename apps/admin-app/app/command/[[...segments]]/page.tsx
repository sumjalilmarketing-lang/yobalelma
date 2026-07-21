import { notFound } from "next/navigation";
import { AuditPage, CommandDashboard, DirectionPage, MissionDetailPage, MissionsPage, TeamsPage, WorkflowsPage } from "@admin-app/src/components/command-pages";
import { loadCommandData, loadMissionDetail } from "@admin-app/src/lib/admin-data";
import { requireAdminSession } from "@admin-app/src/lib/auth";
import { visibleDirectionsForRoles } from "@admin-app/src/lib/governance-catalog";
import { canManageMissions } from "@admin-app/src/lib/governance-catalog";
import { CountryExperiencePage, MonetizationPage } from "@admin-app/src/components/experience-pages";
import { ExperienceSettingsPanel } from "@/components/settings/experience-settings-panel";
import { Page } from "@admin-app/src/components/command-pages";

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
  if (segments[0] === "settings" && segments.length === 1) return <Page eyebrow="Préférences" title="Paramètres" description="Réglez l’affichage et les formats utilisés sur cet appareil."><ExperienceSettingsPanel /></Page>;
  if (segments[0] === "experience-pays" && segments.length === 1 && session.roleIds.some((role) => ["super_admin", "admin", "country_manager"].includes(role))) return <CountryExperiencePage />;
  if (segments[0] === "monetisation" && segments.length === 1 && session.roleIds.some((role) => ["super_admin", "admin", "partner_manager"].includes(role))) return <MonetizationPage />;
  notFound();
}
