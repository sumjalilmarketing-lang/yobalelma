import { InternationalDashboardPage } from "@/components/international/international-dashboard-page";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "International collecte | Yobalelma",
};

export default async function CollectionInternationalPage() {
  return (
    <InternationalDashboardPage
      allowedRoles={["collection_driver", "collection_manager", "operations_manager", "admin", "super_admin"]}
      eyebrow="Collecte"
      title="Collecte relais vers hub"
      description="Planifie les tournees, scelle les manifestes et accompagne les colis internationaux jusqu'au hub."
      returnTo="/dashboard/collection/international"
      scene="operations"
    />
  );
}
