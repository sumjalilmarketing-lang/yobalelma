import Link from "next/link";
import { TravelDocumentForm } from "@/components/forms/travel-document-form";
import { TripForm } from "@/components/forms/trip-form";
import { PageShell } from "@/components/layout/page-shell";
import { Button } from "@/components/ui/button";

export const metadata = {
  title: "Voyager avec Yobalelma | Yobalelma",
};

export default function VoyagerPage() {
  return (
    <PageShell
      eyebrow="Voyage"
      title="Publier un trajet disponible"
      description="Indique ton trajet et ta capacite disponible pour recevoir des demandes de colis compatibles."
      scene="traveler"
    >
      <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
        <div className="rounded-lg border border-black/10 bg-white p-6 shadow-line">
          <TripForm />
        </div>
        <aside className="grid gap-4 self-start rounded-lg bg-accent p-6 shadow-line">
          <h2 className="text-2xl font-black">Trajet fiable</h2>
          <p className="leading-7 text-black/60">
            Publie seulement un voyage confirme. Les colis seront ensuite proposes
            selon la route, le poids et les dates.
          </p>
          <Button asChild>
            <Link href="/dashboard">Voir mon dashboard</Link>
          </Button>
        </aside>
      </div>
      <section className="mt-10 rounded-lg border border-black/10 bg-white p-6 shadow-line">
        <TravelDocumentForm />
      </section>
    </PageShell>
  );
}
