import { InternationalDashboardPage } from "@/components/international/international-dashboard-page";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "International admin | Yobalelma",
};

export default async function AdminInternationalPage() {
  return (
    <InternationalDashboardPage
      allowedRoles={["operations_manager", "admin", "super_admin"]}
      eyebrow="Admin"
      title="Supervision internationale"
      description="Controle transversal du flux client, relais, collecte, hub, voyageur, QR et incidents."
      returnTo="/dashboard/admin/international"
      scene="admin"
    />
  );
}
