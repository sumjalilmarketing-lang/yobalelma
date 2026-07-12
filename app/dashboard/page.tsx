import type { ReactNode } from "react";
import {
  Bell,
  Gauge,
  PackageCheck,
  Plane,
  Route,
  ShieldCheck,
} from "lucide-react";
import {
  PremiumActionCard,
  PremiumEmptyState,
  PremiumKpi,
  PremiumPanel,
  PremiumStory,
} from "@/components/design-system/premium";
import { PageShell } from "@/components/layout/page-shell";
import { Button } from "@/components/ui/button";
import { JourneyVisualStage } from "@/components/visual/yobalelma-world";
import { getDashboardState } from "@/lib/data/dashboard";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Dashboard | Yobalelma",
};

export default async function DashboardPage() {
  const state = await getDashboardState();

  return (
    <PageShell
      eyebrow="Pilotage"
      title="Dashboard Yobalelma"
      description="Suis tes colis, tes voyages et les prochaines actions importantes."
    >
      {state.status === "needs-env" ? <NeedsEnv /> : null}
      {state.status === "signed-out" ? <SignedOut /> : null}
      {state.status === "ready" ? <ReadyDashboard state={state} /> : null}
    </PageShell>
  );
}

function NeedsEnv() {
  return (
    <PremiumPanel tone="support" className="p-6">
      <h2 className="text-2xl font-black">Configuration Supabase requise</h2>
      <p className="mt-3 max-w-2xl leading-7 text-black/60">
        Ajoute les variables securisees `NEXT_PUBLIC_SUPABASE_URL` et
        `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` pour activer les donnees reelles du dashboard.
      </p>
    </PremiumPanel>
  );
}

function SignedOut() {
  return (
    <PremiumEmptyState
      tone="operations"
      title="Connecte-toi pour continuer"
      description="Le dashboard affiche les colis, voyages et offres rattaches a ton compte, avec un contexte adapte a ton role."
      action={{ href: "/auth/sign-in", label: "Connexion" }}
    />
  );
}

function ReadyDashboard({
  state,
}: {
  state: Extract<Awaited<ReturnType<typeof getDashboardState>>, { status: "ready" }>;
}) {
  return (
    <div className="grid gap-8">
      <PremiumStory
        tone="operations"
        eyebrow="Centre de pilotage"
        title="Un tableau de bord pense pour suivre la route, la preuve et la confiance."
        description="Yobalelma rassemble les actions importantes dans une interface claire : expeditions, voyages, offres, alertes et prochaines etapes."
        icon={Gauge}
      >
        <div className="grid gap-4 lg:grid-cols-[1fr_360px] lg:items-center">
          <JourneyVisualStage scene="operations" frame={false} className="min-h-[260px]" />
          <div className="grid gap-3">
            <PremiumActionCard
              href="/envoyer"
              label="Envoyer un colis"
              description="Creer une expedition nationale ou internationale."
              icon={PackageCheck}
              tone="client"
            />
            <PremiumActionCard
              href="/voyager"
              label="Publier un voyage"
              description="Declarer une capacite disponible et recevoir des lots."
              icon={Plane}
              tone="traveler"
            />
          </div>
        </div>
      </PremiumStory>

      <div className="flex flex-col justify-between gap-4 rounded-lg bg-secondary p-6 text-white shadow-panel md:flex-row md:items-center">
        <div>
          <p className="text-sm font-bold uppercase text-primary">Connecte</p>
          <h2 className="mt-2 text-2xl font-black">{state.userEmail}</h2>
        </div>
        <form action="/api/auth/sign-out" method="post">
          <Button type="submit" variant="secondary">
            Deconnexion
          </Button>
        </form>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <PremiumKpi
          tone="client"
          label="Expeditions"
          value={state.shipmentCount}
          icon={PackageCheck}
          description="Colis crees et suivis depuis ton compte."
        />
        <PremiumKpi
          tone="traveler"
          label="Voyages publies"
          value={state.tripCount}
          icon={Plane}
          description="Trajets disponibles ou passes rattaches au profil."
        />
        <PremiumKpi
          tone="operations"
          label="Offres emises"
          value={state.offerCount}
          icon={Route}
          description="Mises en relation et opportunites logistiques."
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Panel title="Dernieres expeditions" empty="Aucune expedition creee.">
          {state.recentShipments.map((shipment) => (
            <Row
              key={shipment.id}
              title={`${shipment.tracking_code} - ${shipment.origin_city} -> ${shipment.destination_city}`}
              detail={shipment.status}
            />
          ))}
        </Panel>
        <Panel title="Prochains voyages" empty="Aucun voyage publie.">
          {state.recentTrips.map((trip) => (
            <Row
              key={trip.id}
              title={`${trip.origin_city} -> ${trip.destination_city}`}
              detail={`${trip.status} - ${trip.departure_date}`}
            />
          ))}
        </Panel>
      </div>

      {state.parcelCount > 0 ? (
        <Panel title="Anciennes demandes MVP" empty="Aucune demande publiee.">
          {state.recentParcels.map((parcel) => (
            <Row
              key={parcel.id}
              title={`${parcel.origin_city} -> ${parcel.destination_city}`}
              detail={parcel.status}
            />
          ))}
        </Panel>
      ) : null}
    </div>
  );
}

function Panel({
  title,
  empty,
  children,
}: {
  title: string;
  empty: string;
  children: ReactNode;
}) {
  const hasChildren = Array.isArray(children) ? children.length > 0 : Boolean(children);

  return (
    <PremiumPanel tone="neutral" className="p-5">
      <div className="flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-md bg-secondary text-primary">
          {title.includes("voyage") ? (
            <Plane className="h-5 w-5" aria-hidden="true" />
          ) : title.includes("expedition") ? (
            <PackageCheck className="h-5 w-5" aria-hidden="true" />
          ) : (
            <Bell className="h-5 w-5" aria-hidden="true" />
          )}
        </span>
        <h2 className="text-xl font-black">{title}</h2>
      </div>
      <div className="mt-4 grid gap-3">{hasChildren ? children : <p className="text-sm font-semibold text-black/60">{empty}</p>}</div>
    </PremiumPanel>
  );
}

function Row({ title, detail }: { title: string; detail: string }) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-md border border-black/10 bg-white/80 p-3 shadow-line">
      <div className="flex items-center gap-3">
        <ShieldCheck className="h-4 w-4 text-primary" aria-hidden="true" />
        <p className="font-bold">{title}</p>
      </div>
      <p className="text-sm font-semibold text-black/60">{detail}</p>
    </div>
  );
}
