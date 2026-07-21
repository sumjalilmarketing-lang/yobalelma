import { PageShell } from "@/components/layout/page-shell";
import { DataCard, DataGrid, EmptyState, ConfigurationNotice } from "@/components/operations/status-panels";
import { requireRole } from "@/lib/auth/server";
import { loadFinalDeliveryOrderByShipment } from "@/lib/final-delivery/data";
import { tryCreateSupabaseServerClient } from "@/lib/supabase/server";
import { toBusinessStatusLabel } from "@/lib/presentation/business-labels";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Detail expedition | Yobalelma",
};

export default async function ClientShipmentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const state = await requireRole(["client"], `/dashboard/client/shipments/${id}`);

  return (
    <PageShell
      eyebrow="Client"
      title="Detail expedition"
      description="Consulte le tracking, les adresses, le colis, la demande d'enlevement et les operations associees."
    >
      {state.status === "ready" ? (
        <ShipmentDetail shipmentId={id} userId={state.userId} />
      ) : (
        <ConfigurationNotice />
      )}
    </PageShell>
  );
}

async function ShipmentDetail({
  shipmentId,
  userId,
}: {
  shipmentId: string;
  userId: string;
}) {
  const supabase = await tryCreateSupabaseServerClient();

  if (!supabase) {
    return <ConfigurationNotice />;
  }

  const [shipmentResult, addressesResult, packageResult, eventsResult, pickupResult, missionsResult] =
    await Promise.all([
      supabase
        .from("shipments")
        .select("*")
        .eq("id", shipmentId)
        .eq("sender_id", userId)
        .maybeSingle(),
      supabase.from("shipment_addresses").select("*").eq("shipment_id", shipmentId),
      supabase.from("shipment_packages").select("*").eq("shipment_id", shipmentId).maybeSingle(),
      supabase
        .from("shipment_status_events")
        .select("*")
        .eq("shipment_id", shipmentId)
        .order("created_at", { ascending: false }),
      supabase.from("pickup_requests").select("*").eq("shipment_id", shipmentId).maybeSingle(),
      supabase
        .from("local_delivery_missions")
        .select("id, transporter_id, status, score, offered_at, accepted_at, picked_up_at, delivered_at")
        .eq("shipment_id", shipmentId)
        .order("created_at", { ascending: false }),
    ]);
  const finalDelivery = await loadFinalDeliveryOrderByShipment(shipmentId);

  if (shipmentResult.error) {
    return <EmptyState title="Expédition indisponible" description="Cette expédition ne peut pas être affichée pour le moment." />;
  }

  const shipment = shipmentResult.data;

  if (!shipment) {
    return <EmptyState title="Expedition introuvable" description="Aucune expedition client ne correspond a cet identifiant." />;
  }

  return (
    <div className="grid gap-8">
      <DataGrid>
        <DataCard
          title={shipment.tracking_code}
          subtitle={`${shipment.origin_city}, ${shipment.origin_country} -> ${shipment.destination_city}, ${shipment.destination_country}`}
          rows={[
            { label: "Statut", value: toBusinessStatusLabel(shipment.status) },
            { label: "Trajet", value: shipment.scope === "international" ? "International" : "National" },
            { label: "Départ", value: shipment.fulfillment_method === "pickup" ? "Enlèvement à domicile" : "Dépôt en point relais" },
            { label: "Remise finale", value: finalDelivery.order ? toBusinessStatusLabel(finalDelivery.order.status) : "En attente de réception à destination" },
            {
              label: "Clôture financière",
              value: shipment.payout_eligible_for_release ? "Prête" : "En attente",
            },
          ]}
        />
        {packageResult.data ? (
          <DataCard
            title={packageResult.data.title}
            subtitle={packageResult.data.category}
            rows={[
              { label: "Poids", value: `${packageResult.data.weight_kg} kg` },
              { label: "Dimensions", value: `${packageResult.data.length_cm} x ${packageResult.data.width_cm} x ${packageResult.data.height_cm} cm` },
              { label: "Fragile", value: packageResult.data.fragile ? "oui" : "non" },
            ]}
          />
        ) : null}
        {pickupResult.data ? (
          <DataCard
            title="Demande d’enlèvement"
            subtitle={toBusinessStatusLabel(pickupResult.data.status)}
            rows={[
              { label: "Date", value: pickupResult.data.requested_for },
              { label: "Affectation", value: pickupResult.data.assigned_transporter_id ? "Livreur affecté" : "En attente d’un livreur" },
            ]}
          />
        ) : null}
      </DataGrid>

      <section className="grid gap-4">
        <h2 className="text-xl font-black">Remise finale</h2>
        <DataGrid>
          {finalDelivery.order ? (
            <DataCard
              title={finalDelivery.order.delivery_mode === "home_delivery" ? "Livraison à domicile" : "Retrait en point relais"}
              subtitle={toBusinessStatusLabel(finalDelivery.order.status)}
              rows={[
                { label: "Relais", value: finalDelivery.order.relay_points ? `${finalDelivery.order.relay_points.name}, ${finalDelivery.order.relay_points.city}` : "Non renseigne" },
                { label: "Emplacement", value: finalDelivery.order.storage_location ?? "Non attribue" },
                { label: "Clôture du trajet", value: finalDelivery.order.traveler_payout_eligible ? "Prête" : "En attente" },
              ]}
            />
          ) : null}
          {finalDelivery.proofs.map((proof) => (
            <DataCard
              key={proof.id}
              title="Preuve autorisee"
              subtitle={proof.method}
              rows={[
                { label: "Remis le", value: new Date(proof.delivered_at).toLocaleString("fr-FR") },
                { label: "Lieu", value: proof.location_label ?? "Destination" },
                { label: "Destinataire", value: proof.recipient_label ?? "Masque" },
              ]}
            />
          ))}
        </DataGrid>
      </section>

      <section className="grid gap-4">
        <h2 className="text-xl font-black">Adresses</h2>
        <DataGrid>
          {(addressesResult.data ?? []).map((address) => (
            <DataCard
              key={address.id}
              title={address.type === "pickup" ? "Depart" : "Destination"}
              subtitle={address.contact_name}
              rows={[
                { label: "Telephone", value: address.contact_phone },
                { label: "Adresse", value: `${address.address_line1}, ${address.city}, ${address.country}` },
                { label: "Instructions", value: address.instructions ?? "Aucune" },
              ]}
            />
          ))}
        </DataGrid>
      </section>

      <section className="grid gap-4">
        <h2 className="text-xl font-black">Missions</h2>
        <DataGrid>
          {(missionsResult.data ?? []).map((mission) => (
            <DataCard
              key={mission.id}
              title="Mission de livraison"
              subtitle={toBusinessStatusLabel(mission.status)}
              rows={[
                { label: "Affectation", value: mission.transporter_id ? "Livreur affecté" : "En attente" },
                { label: "Acceptée", value: mission.accepted_at ? new Date(mission.accepted_at).toLocaleString("fr-FR") : "Pas encore" },
              ]}
            />
          ))}
        </DataGrid>
      </section>

      <section className="grid gap-4">
        <h2 className="text-xl font-black">Tracking</h2>
        <DataGrid>
          {(eventsResult.data ?? []).map((event) => (
            <DataCard
              key={event.id}
              title={toBusinessStatusLabel(event.status)}
              subtitle={new Date(event.created_at).toLocaleString("fr-FR")}
              rows={[
                { label: "Note", value: event.note ?? "Sans note" },
                { label: "Mise à jour", value: event.actor_id ? "Équipe Yobalelma" : "Automatique" },
              ]}
            />
          ))}
        </DataGrid>
      </section>
    </div>
  );
}
