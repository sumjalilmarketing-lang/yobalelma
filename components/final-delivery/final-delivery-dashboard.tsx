import Link from "next/link";
import { CheckCircle2, KeyRound, PackageCheck, ShieldAlert, Truck } from "lucide-react";
import { PremiumBadge, PremiumKpi, PremiumPanel } from "@/components/design-system/premium";
import { DataCard, DataGrid, EmptyState } from "@/components/operations/status-panels";
import type {
  DeliveryEventRow,
  DeliveryOtpRow,
  FinalDeliveryOrder,
  ProofSummaryRow,
} from "@/lib/final-delivery/data";

export function FinalDeliveryOverview({
  orders,
}: {
  orders: FinalDeliveryOrder[];
}) {
  const delivered = orders.filter((order) => order.status === "delivered").length;
  const blocked = orders.filter((order) => order.payout_blocked_reason || order.anomaly_count > 0).length;
  const awaitingPickup = orders.filter((order) => order.status === "awaiting_recipient_pickup").length;
  const homeDelivery = orders.filter((order) => order.delivery_mode === "home_delivery").length;

  return (
    <div className="grid gap-6">
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <PremiumKpi label="Commandes finales" value={orders.length} description="Flux destination actifs." icon={PackageCheck} tone="relay" />
        <PremiumKpi label="Retraits relais" value={awaitingPickup} description="En attente destinataire." icon={KeyRound} tone="relay" />
        <PremiumKpi label="Livraison domicile" value={homeDelivery} description="Missions finales potentielles." icon={Truck} tone="transporter" />
        <PremiumKpi label="Bloquants" value={blocked} description="Anomalies ou payout bloque." icon={ShieldAlert} tone="support" />
      </section>

      {orders.length ? (
        <DataGrid>
          {orders.map((order) => (
            <DataCard
              key={order.id}
              href={`/dashboard/relay/final-delivery/${order.shipment_id}`}
              title={order.shipments?.tracking_code ?? order.shipment_id}
              subtitle={order.status}
              rows={[
                { label: "Mode", value: order.delivery_mode ?? "A choisir" },
                {
                  label: "Relais",
                  value: order.relay_points
                    ? `${order.relay_points.name}, ${order.relay_points.city}`
                    : "Non renseigne",
                },
                { label: "Emplacement", value: order.storage_location ?? "A attribuer" },
                {
                  label: "Payout voyageur",
                  value: order.traveler_payout_eligible ? "liberable" : order.payout_blocked_reason ?? "non liberable",
                },
                {
                  label: "Mise a jour",
                  value: new Date(order.updated_at).toLocaleString("fr-FR"),
                },
              ]}
            />
          ))}
        </DataGrid>
      ) : (
        <EmptyState
          title="Aucune commande finale"
          description="Scanne un QR destination ou receptionne un lot pour alimenter l'inventaire destination."
        />
      )}

      <PremiumPanel tone="relay" className="p-5">
        <PremiumBadge tone="relay">Validation</PremiumBadge>
        <p className="mt-3 text-sm font-semibold leading-6 text-black/65">
          {delivered} colis livres. Les commandes restantes restent visibles tant qu&apos;une preuve de remise validee n&apos;a pas
          ferme l&apos;expedition.
        </p>
      </PremiumPanel>
    </div>
  );
}

export function FinalDeliveryDetail({
  events,
  order,
  otps,
  proofs,
}: {
  events: DeliveryEventRow[];
  order: FinalDeliveryOrder | null;
  otps: DeliveryOtpRow[];
  proofs: ProofSummaryRow[];
}) {
  if (!order) {
    return (
      <EmptyState
        title="Commande finale introuvable"
        description="Cette expedition n'a pas encore ete receptionnee au relais destination."
      />
    );
  }

  return (
    <div className="grid gap-8">
      <DataGrid>
        <DataCard
          title={order.shipments?.tracking_code ?? order.shipment_id}
          subtitle={order.status}
          rows={[
            { label: "Mode", value: order.delivery_mode ?? "A choisir" },
            { label: "Destinataire", value: order.recipient_name ?? "Non renseigne" },
            { label: "Telephone", value: order.recipient_phone_last4 ? `****${order.recipient_phone_last4}` : "Masque" },
            { label: "Emplacement", value: order.storage_location ?? "Non attribue" },
            { label: "Deadline retrait", value: order.pickup_deadline_at ? new Date(order.pickup_deadline_at).toLocaleString("fr-FR") : "Non definie" },
          ]}
        />
        <DataCard
          title="Payouts"
          subtitle={order.payout_blocked_reason ?? "Regles automatiques"}
          rows={[
            { label: "Voyageur", value: order.traveler_payout_eligible ? "liberable" : "bloque" },
            { label: "Livreur final", value: order.final_driver_payout_eligible ? "liberable" : "non eligible" },
            { label: "Anomalies", value: order.anomaly_count },
            { label: "Mission finale", value: order.final_delivery_mission_id ?? "Aucune" },
          ]}
        />
      </DataGrid>

      <section className="grid gap-4">
        <h2 className="text-xl font-black">OTP</h2>
        {otps.length ? (
          <DataGrid>
            {otps.map((otp) => (
              <DataCard
                key={otp.id}
                title={otp.status}
                subtitle={otp.delivery_mode}
                rows={[
                  { label: "Expire", value: new Date(otp.expires_at).toLocaleString("fr-FR") },
                  { label: "Essais", value: otp.attempt_count },
                  { label: "Renvois", value: otp.resend_count },
                  { label: "Blocage", value: otp.blocked_until ? new Date(otp.blocked_until).toLocaleString("fr-FR") : "Non" },
                ]}
              />
            ))}
          </DataGrid>
        ) : (
          <EmptyState title="Aucun OTP actif" description="Genere un OTP serveur pour une remise relay pickup ou home delivery." />
        )}
      </section>

      <section className="grid gap-4">
        <h2 className="text-xl font-black">Preuves autorisees</h2>
        {proofs.length ? (
          <DataGrid>
            {proofs.map((proof) => (
              <DataCard
                key={proof.id}
                title={proof.method}
                subtitle={new Date(proof.delivered_at).toLocaleString("fr-FR")}
                rows={[
                  { label: "Lieu", value: proof.location_label ?? "Destination" },
                  { label: "Destinataire", value: proof.recipient_label ?? "Masque" },
                  { label: "Resume", value: JSON.stringify(proof.summary) },
                ]}
              />
            ))}
          </DataGrid>
        ) : (
          <EmptyState title="Aucune preuve" description="La preuve apparaitra apres OTP valide ou override admin audite." />
        )}
      </section>

      <section className="grid gap-4">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-xl font-black">Evenements</h2>
          <Link href="/dashboard/relay/history" className="text-sm font-black text-primary">
            Historique complet
          </Link>
        </div>
        {events.length ? (
          <div className="grid gap-3">
            {events.map((event) => (
              <article key={event.id} className="rounded-lg border border-black/10 bg-white p-4 shadow-line">
                <div className="flex items-start gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-secondary text-primary">
                    <CheckCircle2 className="h-5 w-5" aria-hidden="true" />
                  </span>
                  <div>
                    <h3 className="text-base font-black">{event.status}</h3>
                    <p className="mt-1 text-sm font-semibold text-black/55">
                      {event.event_type} - {new Date(event.created_at).toLocaleString("fr-FR")}
                    </p>
                    <p className="mt-2 text-sm leading-6 text-black/65">{event.note ?? "Sans note"}</p>
                  </div>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <EmptyState title="Aucun evenement final" description="Les transitions finales seront journalisees ici." />
        )}
      </section>
    </div>
  );
}
