import { InternationalDashboardPage } from "@/components/international/international-dashboard-page";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Assignations voyageur | Yobalelma",
};

export default async function TravelerAssignmentsPage() {
  return (
    <InternationalDashboardPage
      allowedRoles={["traveler"]}
      eyebrow="Voyageur"
      title="Lots assignes"
      description="Suis les lots, QR et handovers visibles pour tes trajets."
      returnTo="/dashboard/traveler/assignments"
      scene="traveler"
    />
  );
}
