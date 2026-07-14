import { InternationalDashboardPage } from "@/components/international/international-dashboard-page";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Tracking relais | Yobalelma",
};

export default async function RelayTrackingPage() {
  return (
    <InternationalDashboardPage
      allowedRoles={["relay_agent", "relay_manager", "operations_manager", "admin", "super_admin"]}
      eyebrow="Relais"
      title="Tracking relais international"
      description="Controle les expeditions internationales visibles par le relais et leurs evenements."
      returnTo="/dashboard/relay/tracking"
      scene="relay"
    />
  );
}
