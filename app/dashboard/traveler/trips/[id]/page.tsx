import { TravelDocumentForm } from "@/components/forms/travel-document-form";
import { FlightTicketExtractor } from "@/components/forms/flight-ticket-extractor";
import { PageShell } from "@/components/layout/page-shell";
import { DataCard, DataGrid, EmptyState, ConfigurationNotice } from "@/components/operations/status-panels";
import { requireRole } from "@/lib/auth/server";
import { tryCreateSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Detail voyage | Yobalelma",
};

export default async function TravelerTripDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const state = await requireRole(["traveler"], `/dashboard/traveler/trips/${id}`);

  return (
    <PageShell
      eyebrow="Voyageur"
      title="Detail voyage"
      description="Soumets ton billet, corrige l'extraction sandbox et suis le statut de validation."
    >
      {state.status === "ready" ? (
        <TripDetail tripId={id} userId={state.userId} />
      ) : (
        <ConfigurationNotice />
      )}
    </PageShell>
  );
}

async function TripDetail({
  tripId,
  userId,
}: {
  tripId: string;
  userId: string;
}) {
  const supabase = await tryCreateSupabaseServerClient();

  if (!supabase) {
    return <ConfigurationNotice />;
  }

  const [tripResult, documentsResult] = await Promise.all([
    supabase.from("trips").select("*").eq("id", tripId).eq("traveler_id", userId).maybeSingle(),
    supabase
      .from("traveler_documents")
      .select("*")
      .eq("trip_id", tripId)
      .eq("traveler_id", userId)
      .order("created_at", { ascending: false }),
  ]);

  if (tripResult.error) {
    return <EmptyState title="Voyage introuvable" description={tripResult.error.message} />;
  }

  if (!tripResult.data) {
    return <EmptyState title="Voyage introuvable" description="Aucun trajet voyageur ne correspond a cet identifiant." />;
  }

  return (
    <div className="grid gap-8">
      <DataGrid>
        <DataCard
          title={`${tripResult.data.origin_city} -> ${tripResult.data.destination_city}`}
          subtitle={tripResult.data.status}
          rows={[
            { label: "Depart", value: tripResult.data.departure_date },
            { label: "Arrivee", value: tripResult.data.arrival_date },
            { label: "Capacite", value: `${tripResult.data.available_weight_kg} kg` },
          ]}
        />
      </DataGrid>
      <FlightTicketExtractor />
      <TravelDocumentForm />
      <section className="grid gap-4">
        <h2 className="text-xl font-black">Billets soumis</h2>
        <DataGrid>
          {(documentsResult.data ?? []).map((document) => (
            <DataCard
              key={document.id}
              title={document.document_number}
              subtitle={document.status}
              rows={[
                { label: "Voyageur", value: document.traveler_name },
                { label: "Vol", value: `${document.departure_airport} -> ${document.arrival_airport}` },
                { label: "Fichier", value: document.file_path },
              ]}
            />
          ))}
        </DataGrid>
      </section>
    </div>
  );
}
