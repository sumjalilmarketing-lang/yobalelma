import Link from "next/link";
import { Luggage, Plane } from "lucide-react";
import {
  PremiumChecklist,
  PremiumStory,
} from "@/components/design-system/premium";
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
      <PremiumStory
        tone="traveler"
        eyebrow="Voyage utile"
        title="Transforme une capacite disponible en route de livraison fiable."
        description="Le voyageur declare son trajet, son billet et sa capacite. Yobalelma garde le controle des preuves, des lots et des scans QR."
        icon={Plane}
      >
        <PremiumChecklist
          tone="traveler"
          items={[
            "Billet et identite verifies avant operation.",
            "Capacite disponible visible pour les colis compatibles.",
            "Lots et QR suivis jusqu'a la destination.",
          ]}
        />
      </PremiumStory>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_360px]">
        <div className="rounded-lg border border-black/10 bg-white p-6 shadow-line">
          <TripForm />
        </div>
        <aside className="grid gap-4 self-start rounded-lg bg-accent p-6 shadow-line">
          <Luggage className="h-8 w-8 text-primary" aria-hidden="true" />
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
    </PageShell>
  );
}
