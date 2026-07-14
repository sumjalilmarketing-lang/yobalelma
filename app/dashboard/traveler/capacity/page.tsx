import { InternationalDashboardPage } from "@/components/international/international-dashboard-page";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Capacite voyageur | Yobalelma",
};

export default async function TravelerCapacityPage() {
  return (
    <InternationalDashboardPage
      allowedRoles={["traveler"]}
      eyebrow="Voyageur"
      title="Capacite disponible"
      description="Controle tes voyages, ta capacite visible et les reservations hub rattachees."
      returnTo="/dashboard/traveler/capacity"
      scene="traveler"
    />
  );
}
