import { TripForm } from "@/components/forms/trip-form";
import { PageShell } from "@/components/layout/page-shell";
import { ConfigurationNotice } from "@/components/operations/status-panels";
import { requireRole } from "@/lib/auth/server";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Nouveau voyage | Yobalelma",
};

export default async function NewTravelerTripPage() {
  const state = await requireRole(["traveler"], "/dashboard/traveler/trips/new");

  return (
    <PageShell
      eyebrow="Voyageur"
      title="Ajouter un voyage"
      description="Declare ta capacite disponible, puis soumets le billet pour validation humaine."
    >
      {state.status === "ready" ? <TripForm /> : <ConfigurationNotice />}
    </PageShell>
  );
}
