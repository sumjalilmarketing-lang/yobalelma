import { DestinationReceptionForm } from "@/components/final-delivery/final-delivery-forms";
import { DestinationQrScanForm } from "@/components/international/destination-qr-scan-form";
import { InternationalWorkflowView } from "@/components/international/international-workflow-view";
import { PageShell } from "@/components/layout/page-shell";
import { ConfigurationNotice } from "@/components/operations/status-panels";
import { requireRole } from "@/lib/auth/server";
import { loadInternationalWorkflowData } from "@/lib/international/workflow-data";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Reception destination | Yobalelma",
};

export default async function RelayDestinationReceptionPage() {
  const state = await requireRole(
    ["relay_agent", "relay_manager", "operations_manager", "admin", "super_admin"],
    "/dashboard/relay/destination-reception",
  );

  if (state.status !== "ready") {
    return (
      <PageShell
        eyebrow="Relais"
        title="Reception destination"
        description="Scanne le QR destination pour receptionner les lots arrives avec le voyageur."
        scene="relay"
      >
        <ConfigurationNotice />
      </PageShell>
    );
  }

  return (
    <PageShell
      eyebrow="Relais"
      title="Reception destination"
      description="Scanne le QR destination pour receptionner les lots arrives avec le voyageur."
      scene="relay"
    >
      <div className="grid gap-8">
        <section className="grid gap-6 xl:grid-cols-2">
          <DestinationQrScanForm />
          <DestinationReceptionForm />
        </section>
        <InternationalWorkflowView
          data={await loadInternationalWorkflowData({
            role: state.role,
            userId: state.userId,
          })}
        />
      </div>
    </PageShell>
  );
}
