import { Navigation, Truck } from "lucide-react";
import {
  PremiumChecklist,
  PremiumStory,
} from "@/components/design-system/premium";
import { ProfileForm } from "@/components/forms/profile-form";
import { TransporterOperationsForm } from "@/components/forms/transporter-operations-form";
import { PageShell } from "@/components/layout/page-shell";

export const metadata = {
  title: "Devenir livreur | Yobalelma",
};

export default function LivreurPage() {
  return (
    <PageShell
      eyebrow="Livreur"
      title="Creer ton profil voyageur-livreur"
      description="Un profil clair augmente la confiance et prepare les prochains controles d'identite et de trajet."
      scene="transporter"
    >
      <PremiumStory
        tone="transporter"
        eyebrow="Mobilite locale"
        title="Un espace dynamique pour les missions d'enlevement, depot et livraison finale."
        description="Le livreur Yobalelma doit voir rapidement ses zones, sa disponibilite, ses missions et les preuves attendues."
        icon={Truck}
      >
        <PremiumChecklist
          tone="transporter"
          items={[
            "Profil terrain structure pour les missions locales.",
            "Zones et vehicules prepares pour le matching.",
            "Scans et preuves rattaches aux missions.",
          ]}
        />
      </PremiumStory>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_360px]">
        <div className="rounded-lg border border-black/10 bg-white p-6 shadow-line">
          <ProfileForm />
        </div>
        <aside className="grid gap-4 self-start rounded-lg border border-black/10 bg-white p-6 shadow-line">
          <Navigation className="h-8 w-8 text-primary" aria-hidden="true" />
          <h2 className="text-2xl font-black">Ce profil sert a quoi ?</h2>
          <p className="leading-7 text-black/60">
            Il permet d&apos;attribuer les voyages, les offres et les evenements de suivi
            au bon compte Yobalelma. Les controles avances arriveront dans la phase
            verification.
          </p>
        </aside>
      </div>
      <section className="mt-10 rounded-lg border border-black/10 bg-white p-6 shadow-line">
        <TransporterOperationsForm />
      </section>
    </PageShell>
  );
}
