import { notFound } from "next/navigation";
import {
  TrackingResult,
  TrackingSearchForm,
} from "@/components/tracking/public-tracking";
import { PageShell } from "@/components/layout/page-shell";
import { ConfigurationNotice, EmptyState } from "@/components/operations/status-panels";
import {
  getPublicTrackingState,
  normalizeTrackingCode,
} from "@/lib/tracking/public";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Suivi public | Yobalelma",
};

export default async function PublicTrackingCodePage({
  params,
}: {
  params: Promise<{ trackingCode: string }>;
}) {
  const { trackingCode: rawTrackingCode } = await params;
  const trackingCode = normalizeTrackingCode(decodeURIComponent(rawTrackingCode));
  const state = await getPublicTrackingState(trackingCode);

  if (state.status === "not-found") {
    notFound();
  }

  return (
    <PageShell
      eyebrow="Suivi public"
      title={trackingCode}
      description="Statut public filtre pour proteger les informations personnelles et operationnelles sensibles."
      scene="client"
    >
      <div className="grid gap-8">
        <TrackingSearchForm defaultValue={trackingCode} />

        {state.status === "invalid" ? (
          <EmptyState
            title="Code invalide"
            description="Ce lien ne respecte pas le format public Yobalelma YBL-XXXXXXXX."
          />
        ) : null}

        {state.status === "needs-env" ? <ConfigurationNotice /> : null}

        {state.status === "ready" ? <TrackingResult shipment={state.shipment} /> : null}
      </div>
    </PageShell>
  );
}
