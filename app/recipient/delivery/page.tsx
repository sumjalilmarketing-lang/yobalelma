import { DeliveryChoiceForm, DeliveryOtpPanel } from "@/components/final-delivery/final-delivery-forms";
import { FinalDeliveryOverview } from "@/components/final-delivery/final-delivery-dashboard";
import { PageShell } from "@/components/layout/page-shell";
import { EmptyState } from "@/components/operations/status-panels";
import { loadFinalDeliveryOrders } from "@/lib/final-delivery/data";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Remise destinataire | Yobalelma",
};

export default async function RecipientDeliveryPage() {
  const { data, error } = await loadFinalDeliveryOrders(12);

  return (
    <PageShell
      eyebrow="Destinataire"
      title="Remise de colis"
      description="Choix retrait ou livraison finale, OTP a usage unique, preuve de remise et suivi discret."
      scene="traveler"
    >
      <div className="grid gap-8">
        {error ? <EmptyState title="Connexion requise" description={error} /> : <FinalDeliveryOverview orders={data} />}
        <section className="grid gap-6 xl:grid-cols-2">
          <DeliveryChoiceForm />
          <DeliveryOtpPanel />
        </section>
      </div>
    </PageShell>
  );
}
