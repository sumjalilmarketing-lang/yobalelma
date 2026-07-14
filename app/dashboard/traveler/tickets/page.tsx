import { TravelDocumentForm } from "@/components/forms/travel-document-form";
import { PageShell } from "@/components/layout/page-shell";
import { DataCard, DataGrid, EmptyState, ConfigurationNotice } from "@/components/operations/status-panels";
import { requireRole } from "@/lib/auth/server";
import { tryCreateSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Billets voyageur | Yobalelma",
};

export default async function TravelerTicketsPage() {
  const state = await requireRole(["traveler"], "/dashboard/traveler/tickets");

  return (
    <PageShell
      eyebrow="Voyageur"
      title="Billets et documents"
      description="Soumets le billet associe a un trajet pour rendre ta capacite eligible aux lots hub."
      scene="traveler"
    >
      {state.status === "ready" ? (
        <div className="grid gap-8">
          <div className="rounded-lg border border-black/10 bg-white p-5 shadow-line">
            <TravelDocumentForm />
          </div>
          <TravelerDocuments userId={state.userId} />
        </div>
      ) : (
        <ConfigurationNotice />
      )}
    </PageShell>
  );
}

async function TravelerDocuments({ userId }: { userId: string }) {
  const supabase = await tryCreateSupabaseServerClient();

  if (!supabase) {
    return <ConfigurationNotice />;
  }

  const { data, error } = await supabase
    .from("traveler_documents")
    .select("id, trip_id, document_number, departure_airport, arrival_airport, departure_date, arrival_date, status, manual_review_required")
    .eq("traveler_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    return <EmptyState title="Chargement impossible" description={error.message} />;
  }

  if (!data?.length) {
    return <EmptyState title="Aucun billet soumis" description="Publie un voyage puis ajoute un billet pour activer les reservations hub." />;
  }

  return (
    <DataGrid>
      {data.map((document) => (
        <DataCard
          key={document.id}
          title={document.document_number}
          subtitle={document.status}
          rows={[
            { label: "Trajet", value: document.trip_id },
            { label: "Route aeroport", value: `${document.departure_airport} -> ${document.arrival_airport}` },
            { label: "Depart", value: document.departure_date },
            { label: "Review", value: document.manual_review_required ? "Revue manuelle" : "Automatique" },
          ]}
        />
      ))}
    </DataGrid>
  );
}
