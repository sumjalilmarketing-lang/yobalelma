import { PageShell } from "@/components/layout/page-shell";
import {
  ConfigurationNotice,
  EmptyState,
} from "@/components/operations/status-panels";
import { TrackingResult, TrackingSearchForm } from "@/components/tracking/public-tracking";
import {
  getPublicTrackingState,
  normalizeTrackingCode,
} from "@/lib/tracking/public";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Suivi colis | Yobalelma",
  description: "Suivre un colis Yobalelma avec un code de suivi public et protege.",
};

export default async function PublicTrackingPage({
  searchParams,
}: {
  searchParams?: Promise<{ code?: string }>;
}) {
  const params = await searchParams;
  const trackingCode = params?.code ? normalizeTrackingCode(params.code) : "";
  const state = await getPublicTrackingState(trackingCode);

  return (
    <PageShell
      eyebrow="Suivi public"
      title="Suivre un colis"
      description="Entre un code Yobalelma pour consulter le statut public sans exposer les donnees privees du client, du destinataire ou du livreur."
      scene="client"
    >
      <div className="grid gap-8">
        <TrackingSearchForm defaultValue={trackingCode} />

        {state.status === "idle" ? (
          <EmptyState
            title="Code de suivi requis"
            description="Le code commence par YBL et contient 8 caracteres, par exemple YBL-1234ABCD."
          />
        ) : null}

        {state.status === "invalid" ? (
          <EmptyState
            title="Code invalide"
            description="Verifie le format du code de suivi. Les codes publics Yobalelma suivent le format YBL-XXXXXXXX."
          />
        ) : null}

        {state.status === "needs-env" ? <ConfigurationNotice /> : null}

        {state.status === "not-found" ? (
          <EmptyState
            title="Aucun colis trouve"
            description="Ce code ne correspond a aucune expedition publique disponible. Verifie le code ou contacte le support."
            action={{ href: "/support", label: "Contacter le support" }}
          />
        ) : null}

        {state.status === "ready" ? <TrackingResult shipment={state.shipment} /> : null}
      </div>
    </PageShell>
  );
}
