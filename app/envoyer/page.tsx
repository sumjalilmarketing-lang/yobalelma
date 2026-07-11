import Link from "next/link";
import { ShipmentForm } from "@/components/forms/shipment-form";
import { PageShell } from "@/components/layout/page-shell";
import { Button } from "@/components/ui/button";

export const metadata = {
  title: "Envoyer un colis | Yobalelma",
};

export default function EnvoyerPage() {
  return (
    <PageShell
      eyebrow="Expediteur"
      title="Creer une expedition"
      description="Renseigne les adresses, le colis et les dates. Yobalelma calcule le type de trajet, le prix estime, le delai et le code de suivi."
      scene="client"
    >
      <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
        <div className="rounded-lg border border-black/10 bg-white p-6 shadow-line">
          <ShipmentForm />
        </div>
        <aside className="grid gap-4 self-start rounded-lg bg-secondary p-6 text-white shadow-panel">
          <h2 className="text-2xl font-black">Avant de confirmer</h2>
          <p className="leading-7 text-white/70">
            Connecte-toi, verifie les adresses, declare la valeur et confirme que le
            colis ne contient aucun objet interdit. Le code de suivi est cree apres
            confirmation.
          </p>
          <Button asChild variant="secondary">
            <Link href="/auth/sign-in">Me connecter</Link>
          </Button>
        </aside>
      </div>
    </PageShell>
  );
}
