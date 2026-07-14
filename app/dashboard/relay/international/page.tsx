import { InternationalDashboardPage } from "@/components/international/international-dashboard-page";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "International relais | Yobalelma",
};

export default async function RelayInternationalPage() {
  return (
    <InternationalDashboardPage
      allowedRoles={["relay_agent", "relay_manager", "operations_manager", "admin", "super_admin"]}
      eyebrow="Relais"
      title="Relais international"
      description="Reception origine, stockage, sortie collecte et scan destination sur une interface unique."
      returnTo="/dashboard/relay/international"
      scene="relay"
    />
  );
}
