import {
  DeliveryChoiceForm,
  DeliveryOtpPanel,
  DestinationReceptionForm,
  FinalDeliveryAttemptForm,
  FinalMileMissionForm,
} from "@/components/final-delivery/final-delivery-forms";
import { FinalDeliveryOverview } from "@/components/final-delivery/final-delivery-dashboard";
import { PageShell } from "@/components/layout/page-shell";
import { ConfigurationNotice, EmptyState } from "@/components/operations/status-panels";
import { requireRole } from "@/lib/auth/server";
import { loadFinalDeliveryOrders } from "@/lib/final-delivery/data";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Livraison finale destination | Yobalelma",
};

export default async function RelayFinalDeliveryPage() {
  const state = await requireRole(
    ["relay_agent", "relay_manager", "operations_manager", "support_agent", "admin", "super_admin"],
    "/dashboard/relay/final-delivery",
  );

  if (state.status !== "ready") {
    return (
      <PageShell
        eyebrow="Relais"
        title="Livraison finale destination"
        description="Controle du stock destination, OTP, remise finale, anomalies et payouts liberables."
        scene="relay"
      >
        <ConfigurationNotice />
      </PageShell>
    );
  }

  const { data, error } = await loadFinalDeliveryOrders();

  return (
    <PageShell
      eyebrow="Relais"
      title="Livraison finale destination"
      description="Controle du stock destination, OTP, remise finale, anomalies et payouts liberables."
      scene="relay"
    >
      <div className="grid gap-8">
        {error ? <EmptyState title="Lecture impossible" description={error} /> : <FinalDeliveryOverview orders={data} />}
        <section className="grid gap-6 xl:grid-cols-2">
          <DestinationReceptionForm />
          <DeliveryChoiceForm />
          <FinalMileMissionForm />
          <FinalDeliveryAttemptForm />
        </section>
        <DeliveryOtpPanel />
      </div>
    </PageShell>
  );
}
