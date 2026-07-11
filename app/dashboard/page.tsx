import Link from "next/link";
import type { ReactNode } from "react";
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
    <div className="rounded-lg border border-amber-200 bg-amber-50 p-6">
      <h2 className="text-2xl font-black">Configuration Supabase requise</h2>
      <p className="mt-3 max-w-2xl leading-7 text-black/60">
        Ajoute les variables securisees `NEXT_PUBLIC_SUPABASE_URL` et
        `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` pour activer les donnees reelles du dashboard.
      </p>
    </div>
  );
}

function SignedOut() {
  return (
    <div className="grid gap-5 rounded-lg border border-black/10 bg-white p-6 shadow-line">
      <h2 className="text-2xl font-black">Connecte-toi pour continuer</h2>
      <p className="max-w-2xl leading-7 text-black/60">
        Le dashboard affiche les colis, voyages et offres rattaches a ton compte.
      </p>
      <Button asChild>
        <Link href="/auth/sign-in">Connexion</Link>
      </Button>
    </div>
  );
}

function ReadyDashboard({
  state,
}: {
  state: Extract<Awaited<ReturnType<typeof getDashboardState>>, { status: "ready" }>;
}) {
  return (
    <div className="grid gap-8">
      <JourneyVisualStage scene="operations" />
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
        <Metric label="Expeditions" value={state.shipmentCount} />
        <Metric label="Voyages publies" value={state.tripCount} />
        <Metric label="Offres emises" value={state.offerCount} />
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

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-black/10 bg-white p-5 shadow-line">
      <p className="text-sm font-bold text-black/50">{label}</p>
      <p className="mt-2 text-4xl font-black">{value}</p>
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
    <section className="rounded-lg border border-black/10 bg-white p-5 shadow-line">
      <h2 className="text-xl font-black">{title}</h2>
      <div className="mt-4 grid gap-3">{hasChildren ? children : <p>{empty}</p>}</div>
    </section>
  );
}

function Row({ title, detail }: { title: string; detail: string }) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-md bg-muted p-3">
      <p className="font-bold">{title}</p>
      <p className="text-sm text-black/60">{detail}</p>
    </div>
  );
}
