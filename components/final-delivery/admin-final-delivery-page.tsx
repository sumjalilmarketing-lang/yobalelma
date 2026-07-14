import type { ReactNode } from "react";
import { AdminOverrideForm } from "@/components/final-delivery/final-delivery-forms";
import { PageShell } from "@/components/layout/page-shell";
import { DataCard, DataGrid, EmptyState, ConfigurationNotice } from "@/components/operations/status-panels";
import { requireRole } from "@/lib/auth/server";
import { loadAdminFinalDeliveryAudit } from "@/lib/final-delivery/data";

export async function AdminFinalDeliveryPage({
  description,
  focus,
  title,
}: {
  description: string;
  focus: "corrections" | "overrides" | "otp" | "proofs" | "payouts" | "audit";
  title: string;
}) {
  const state = await requireRole(["operations_manager", "support_agent", "finance_agent", "admin", "super_admin"], `/dashboard/admin/${focus}`);

  if (state.status !== "ready") {
    return (
      <PageShell eyebrow="Admin" title={title} description={description} scene="admin">
        <ConfigurationNotice />
      </PageShell>
    );
  }

  const audit = await loadAdminFinalDeliveryAudit();

  return (
    <PageShell eyebrow="Admin" title={title} description={description} scene="admin">
      <div className="grid gap-8">
        {audit.error ? <EmptyState title="Lecture partielle" description={audit.error} /> : null}
        {focus === "overrides" ? <AdminOverrideForm /> : null}
        {focus === "corrections" || focus === "overrides" || focus === "audit" ? (
          <Section title="Corrections manuelles" empty="Aucune correction manuelle." rows={audit.corrections.map((item) => ({
            href: `/dashboard/admin/manual-corrections/${item.id}`,
            key: item.id,
            rows: [
              { label: "Entite", value: `${item.entity_type} ${item.entity_id}` },
              { label: "Permission", value: item.permission_key },
              { label: "Motif", value: item.reason },
              { label: "Date", value: new Date(item.created_at).toLocaleString("fr-FR") },
            ],
            subtitle: item.status,
            title: item.action,
          }))} />
        ) : null}
        {focus === "otp" || focus === "audit" ? (
          <Section title="OTP events" empty="Aucun OTP." rows={audit.otps.map((item) => ({
            key: item.id,
            rows: [
              { label: "Expedition", value: item.shipment_id },
              { label: "Mode", value: item.delivery_mode },
              { label: "Essais", value: item.attempt_count },
              { label: "Expire", value: new Date(item.expires_at).toLocaleString("fr-FR") },
            ],
            subtitle: item.status,
            title: item.id,
          }))} />
        ) : null}
        {focus === "proofs" || focus === "audit" ? (
          <Section title="Preuves de remise autorisees" empty="Aucune preuve." rows={audit.proofs.map((item) => ({
            key: item.id,
            rows: [
              { label: "Expedition", value: item.shipment_id },
              { label: "Lieu", value: item.location_label ?? "Destination" },
              { label: "Destinataire", value: item.recipient_label ?? "Masque" },
              { label: "Date", value: new Date(item.delivered_at).toLocaleString("fr-FR") },
            ],
            subtitle: item.method,
            title: item.proof_of_delivery_id,
          }))} />
        ) : null}
        {focus === "payouts" || focus === "audit" ? (
          <Section title="Revue payout" empty="Aucun evenement payout." rows={audit.payoutEvents.map((item) => ({
            key: item.id,
            rows: [
              { label: "Expedition", value: item.shipment_id },
              { label: "Beneficiaire", value: item.beneficiary_id ?? "Non renseigne" },
              { label: "Raison blocage", value: item.blocked_reason ?? "Aucune" },
              { label: "Payout", value: item.payout_id ?? "Non cree" },
            ],
            subtitle: item.eligible ? "eligible" : "bloque",
            title: item.beneficiary_role,
          }))} />
        ) : null}
        {focus === "audit" ? (
          <Section title="Evenements livraison finale" empty="Aucun evenement." rows={audit.events.map((item) => ({
            href: `/dashboard/relay/final-delivery/${item.shipment_id}`,
            key: item.id,
            rows: [
              { label: "Expedition", value: item.shipment_id },
              { label: "Type", value: item.event_type },
              { label: "Note", value: item.note ?? "Sans note" },
              { label: "Date", value: new Date(item.created_at).toLocaleString("fr-FR") },
            ],
            subtitle: item.status,
            title: item.id,
          }))} />
        ) : null}
      </div>
    </PageShell>
  );
}

function Section({
  empty,
  rows,
  title,
}: {
  empty: string;
  rows: Array<{
    href?: string;
    key: string;
    rows: { label: string; value: ReactNode }[];
    subtitle: string;
    title: string;
  }>;
  title: string;
}) {
  return (
    <section className="grid gap-4">
      <h2 className="text-xl font-black">{title}</h2>
      {rows.length ? (
        <DataGrid>
          {rows.map((row) => (
            <DataCard key={row.key} href={row.href} title={row.title} subtitle={row.subtitle} rows={row.rows} />
          ))}
        </DataGrid>
      ) : (
        <EmptyState title={empty} description="Les donnees apparaitront apres execution d'un parcours destination." />
      )}
    </section>
  );
}
