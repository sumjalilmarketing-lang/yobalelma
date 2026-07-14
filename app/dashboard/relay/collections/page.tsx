import { InternationalDashboardPage } from "@/components/international/international-dashboard-page";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Collectes relais | Yobalelma",
};

export default async function RelayCollectionsPage() {
  return (
    <InternationalDashboardPage
      allowedRoles={["relay_agent", "relay_manager", "operations_manager", "admin", "super_admin"]}
      eyebrow="Relais"
      title="Collectes relais"
      description="Suit les colis stockes, les sorties relais et les manifestes vers le hub."
      returnTo="/dashboard/relay/collections"
      scene="relay"
    />
  );
}
