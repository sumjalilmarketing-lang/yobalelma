import { InternationalDashboardPage } from "@/components/international/international-dashboard-page";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "International hub | Yobalelma",
};

export default async function HubInternationalPage() {
  return (
    <InternationalDashboardPage
      allowedRoles={["hub_agent", "hub_manager", "operations_manager", "admin", "super_admin"]}
      eyebrow="Hub"
      title="Hub international"
      description="Receptionne, inspecte, stocke, reserve la capacite voyageur et gere les QR de remise."
      returnTo="/dashboard/hub/international"
      scene="hub"
    />
  );
}
