import { notFound } from "next/navigation";
import { AuditPage, CommandDashboard, DirectionPage, MissionDetailPage, MissionsPage, TeamsPage, WorkflowsPage } from "@admin-app/src/components/command-pages";
import { loadCommandData, loadMissionDetail } from "@admin-app/src/lib/admin-data";
import { requireAdminSession } from "@admin-app/src/lib/auth";
import { visibleDirectionsForRoles } from "@admin-app/src/lib/governance-catalog";
import { canManageMissions } from "@admin-app/src/lib/governance-catalog";
import { CountryExperiencePage, MonetizationPage } from "@admin-app/src/components/experience-pages";
import { ExperienceSettingsPanel } from "@/components/settings/experience-settings-panel";
import { Page } from "@admin-app/src/components/command-pages";
import { FinancePaymentsPage, FinancePayoutsPage } from "@admin-app/src/components/finance-pages";
import { canAccessFinance, loadFinanceData } from "@admin-app/src/lib/finance-data";
import { OrangeIntegrationsPage } from "@admin-app/src/components/orange-integrations-page";
import { canAccessOrangeIntegrations, loadOrangeIntegrationData } from "@admin-app/src/lib/orange-integrations";
import { CustomsPage } from "@admin-app/src/components/customs-pages";
import { canAccessCustoms, customsSections, loadCustomsData, type CustomsSection } from "@admin-app/src/lib/customs-data";
import { DispatchPage } from "@admin-app/src/components/dispatch-page";
import { canAccessDispatch, loadDispatchData } from "@admin-app/src/lib/dispatch-data";
import { ControlTowerPage } from "@admin-app/src/components/control-tower-page";
import { canAccessControlTower, loadControlTowerData } from "@admin-app/src/lib/control-tower-data";
import { ParcelPassportPage } from "@admin-app/src/components/parcel-passport-page";
import { canInvestigateParcels, loadParcelPassport } from "@admin-app/src/lib/parcel-passport-data";

export const dynamic = "force-dynamic";

export default async function CommandPage({ params, searchParams }: { params: Promise<{ segments?: string[] }>; searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const { segments = [] } = await params;
  const session = await requireAdminSession(`/command/${segments.join("/")}`);
  if (!segments.length && canAccessControlTower(session)) {
    const query=await searchParams; const value=(key:string)=>typeof query[key]==="string"?query[key]:undefined;
    const tower=await loadControlTowerData(session,{country:value("country"),view:value("view"),from:value("from"),to:value("to")}); if(!tower)notFound(); return <ControlTowerPage data={tower}/>;
  }
  const data = await loadCommandData(session);
  if (!segments.length) return <CommandDashboard session={session} data={data} directions={visibleDirectionsForRoles(session.roleIds)} />;
  if (segments[0] === "control-tower" && segments.length === 1 && canAccessControlTower(session)) {
    const query=await searchParams; const value=(key:string)=>typeof query[key]==="string"?query[key]:undefined;
    const tower=await loadControlTowerData(session,{country:value("country"),view:value("view"),from:value("from"),to:value("to")}); if(!tower)notFound(); return <ControlTowerPage data={tower}/>;
  }
  if (segments[0] === "passports" && segments.length === 1 && canInvestigateParcels(session)) {
    const query = await searchParams;
    const reference = typeof query.query === "string" ? query.query : undefined;
    const passport = await loadParcelPassport(session, reference);
    return <ParcelPassportPage data={passport} reference={reference} />;
  }
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
  if (segments[0] === "finance" && segments[1] === "paiements" && segments.length === 2 && canAccessFinance(session)) {
    const query = await searchParams;
    const value = (key: string) => typeof query[key] === "string" ? query[key] : undefined;
    const filters = { country: value("country"), currency: value("currency"), from: value("from"), query: value("query"), status: value("status"), to: value("to") };
    const finance = await loadFinanceData(session, filters);
    if (!finance) notFound();
    return <FinancePaymentsPage data={finance} filters={filters} />;
  }
  if (segments[0] === "finance" && segments[1] === "reversements" && segments.length === 2 && canAccessFinance(session)) {
    const finance = await loadFinanceData(session);
    if (!finance) notFound();
    return <FinancePayoutsPage data={finance} />;
  }
  if (segments[0] === "integrations" && segments[1] === "orange" && segments.length === 2 && canAccessOrangeIntegrations(session)) {
    const integration = await loadOrangeIntegrationData(session);
    if (!integration) notFound();
    return <OrangeIntegrationsPage data={integration} />;
  }
  if (segments[0] === "douane" && segments.length <= 2 && canAccessCustoms(session)) {
    const section = segments[1];
    if (section && !customsSections.includes(section as CustomsSection)) notFound();
    const customs = await loadCustomsData(session);
    if (!customs) notFound();
    return <CustomsPage data={customs} section={section as CustomsSection | undefined} />;
  }
  if (segments[0] === "operations" && segments[1] === "dispatch" && segments.length === 2 && canAccessDispatch(session)) {
    const dispatch = await loadDispatchData(session); if (!dispatch) notFound(); return <DispatchPage data={dispatch} />;
  }
  if (segments[0] === "settings" && segments.length === 1) return <Page eyebrow="Préférences" title="Paramètres" description="Réglez l’affichage et les formats utilisés sur cet appareil."><ExperienceSettingsPanel /></Page>;
  if (segments[0] === "experience-pays" && segments.length === 1 && session.roleIds.some((role) => ["super_admin", "admin", "country_manager"].includes(role))) return <CountryExperiencePage />;
  if (segments[0] === "monetisation" && segments.length === 1 && session.roleIds.some((role) => ["super_admin", "admin", "partner_manager"].includes(role))) return <MonetizationPage />;
  notFound();
}
