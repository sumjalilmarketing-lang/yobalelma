import { InternationalDashboardPage } from "@/components/international/international-dashboard-page";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "International voyageur | Yobalelma",
};

export default async function TravelerInternationalPage() {
  return (
    <InternationalDashboardPage
      allowedRoles={["traveler"]}
      eyebrow="Voyageur"
      title="Voyageur international"
      description="Publie tes voyages, declare ta capacite, suis les lots assignes et presente les QR au bon moment."
      returnTo="/dashboard/traveler/international"
      scene="traveler"
    />
  );
}
