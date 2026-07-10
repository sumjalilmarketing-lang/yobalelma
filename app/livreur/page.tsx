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
    >
      <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
        <div className="rounded-lg border border-black/10 bg-white p-6 shadow-sm">
          <ProfileForm />
        </div>
        <aside className="grid gap-4 self-start rounded-lg border border-black/10 p-6">
          <h2 className="text-2xl font-black">Ce profil sert a quoi ?</h2>
          <p className="leading-7 text-black/62">
            Il permet d&apos;attribuer les voyages, les offres et les evenements de suivi
            au bon compte Yobalelma. Les controles avances arriveront dans la phase
            verification.
          </p>
        </aside>
      </div>
      <section className="mt-10 rounded-lg border border-black/10 bg-white p-6 shadow-sm">
        <TransporterOperationsForm />
      </section>
    </PageShell>
  );
}
