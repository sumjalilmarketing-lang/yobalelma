import { DeliveryChoiceForm, DeliveryOtpPanel } from "@/components/final-delivery/final-delivery-forms";
import { FinalDeliveryDetail } from "@/components/final-delivery/final-delivery-dashboard";
import { PageShell } from "@/components/layout/page-shell";
import { EmptyState } from "@/components/operations/status-panels";
import { loadFinalDeliveryOrderByShipment } from "@/lib/final-delivery/data";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Remise destinataire | Yobalelma",
};

export default async function RecipientDeliveryDetailPage({
  params,
}: {
  params: Promise<{ shipmentId: string }>;
}) {
  const { shipmentId } = await params;
  const { events, order, otps, proofs, error } = await loadFinalDeliveryOrderByShipment(shipmentId);

  return (
    <PageShell
      eyebrow="Destinataire"
      title="Remise de colis"
      description="Consulte le relais, choisis le mode de remise, demande un OTP et suis la livraison finale."
      scene="traveler"
    >
      <div className="grid gap-8">
        {error ? <EmptyState title="Lecture partielle" description={error} /> : null}
        <FinalDeliveryDetail events={events} order={order} otps={otps} proofs={proofs} />
        <section className="grid gap-6 xl:grid-cols-2">
          <DeliveryChoiceForm shipmentId={shipmentId} />
          <DeliveryOtpPanel deliveryMode={order?.delivery_mode ?? "relay_pickup"} shipmentId={shipmentId} />
        </section>
      </div>
    </PageShell>
  );
}
