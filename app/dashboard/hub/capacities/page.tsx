import { InternationalDashboardPage } from "@/components/international/international-dashboard-page";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Capacites hub | Yobalelma",
};

export default async function HubCapacitiesPage() {
  return (
    <InternationalDashboardPage
      allowedRoles={["hub_agent", "hub_manager", "operations_manager", "admin", "super_admin"]}
      eyebrow="Hub"
      title="Capacites voyageurs"
      description="Controle les trajets, lots, poids reserves et QR actifs avant handover."
      returnTo="/dashboard/hub/capacities"
      scene="hub"
    />
  );
}
