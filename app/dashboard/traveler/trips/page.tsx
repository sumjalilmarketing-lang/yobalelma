import Link from "next/link";
import { PageShell } from "@/components/layout/page-shell";
import { DataCard, DataGrid, EmptyState, ConfigurationNotice } from "@/components/operations/status-panels";
import { Button } from "@/components/ui/button";
import { requireRole } from "@/lib/auth/server";
import { tryCreateSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Voyages | Yobalelma",
};

export default async function TravelerTripsPage() {
  const state = await requireRole(["traveler"], "/dashboard/traveler/trips");

  return (
    <PageShell
      eyebrow="Voyageur"
      title="Mes voyages"
      description="Gere les trajets, la capacite disponible et les documents de voyage."
    >
      <div className="mb-6">
        <Button asChild>
          <Link href="/dashboard/traveler/trips/new">Nouveau voyage</Link>
        </Button>
      </div>
      {state.status === "ready" ? <Trips userId={state.userId} /> : <ConfigurationNotice />}
    </PageShell>
  );
}

async function Trips({ userId }: { userId: string }) {
  const supabase = await tryCreateSupabaseServerClient();

  if (!supabase) {
    return <ConfigurationNotice />;
  }

  const { data, error } = await supabase
    .from("trips")
    .select("id, origin_city, origin_country, destination_city, destination_country, departure_date, arrival_date, available_weight_kg, status")
    .eq("traveler_id", userId)
    .order("departure_date", { ascending: true });

  if (error) {
    return <EmptyState title="Chargement impossible" description={error.message} />;
  }

  if (!data?.length) {
    return (
      <EmptyState
        title="Aucun voyage"
        description="Declare un trajet pour proposer une capacite de transport internationale."
        action={{ href: "/dashboard/traveler/trips/new", label: "Ajouter un voyage" }}
      />
    );
  }

  return (
    <DataGrid>
      {data.map((trip) => (
        <DataCard
          key={trip.id}
          title={`${trip.origin_city} -> ${trip.destination_city}`}
          subtitle={trip.status}
          href={`/dashboard/traveler/trips/${trip.id}`}
          rows={[
            { label: "Depart", value: `${trip.departure_date} (${trip.origin_country})` },
            { label: "Arrivee", value: `${trip.arrival_date} (${trip.destination_country})` },
            { label: "Capacite", value: `${trip.available_weight_kg} kg` },
          ]}
        />
      ))}
    </DataGrid>
  );
}
