import type { ReactNode } from "react";
import { SupportTicketForm } from "@/components/forms/operations-forms";
import { PageShell } from "@/components/layout/page-shell";
import {
  ConfigurationNotice,
  DataCard,
  DataGrid,
  EmptyState,
} from "@/components/operations/status-panels";
import { requireRole } from "@/lib/auth/server";
import type { PlatformRole } from "@/lib/auth/roles";
import { toBusinessStatusLabel } from "@/lib/presentation/business-labels";
import { tryCreateSupabaseServerClient } from "@/lib/supabase/server";

const supportLabels = {
  client: { area: "client", eyebrow: "Client" },
  local_transporter: { area: "transporter", eyebrow: "Livreur" },
  traveler: { area: "traveler", eyebrow: "Voyageur" },
} as const;

type UserSupportRole = keyof typeof supportLabels;

export async function UserSupportPage({ role }: { role: UserSupportRole }) {
  const labels = supportLabels[role];
  const state = await requireRole(
    [role as PlatformRole],
    `/${labels.area}/support`,
  );

  if (state.status !== "ready") {
    return (
      <SupportShell eyebrow={labels.eyebrow}>
        <ConfigurationNotice />
      </SupportShell>
    );
  }

  const supabase = await tryCreateSupabaseServerClient();
  if (!supabase) {
    return (
      <SupportShell eyebrow={labels.eyebrow}>
        <ConfigurationNotice />
      </SupportShell>
    );
  }

  const { data, error } = await supabase
    .from("support_tickets")
    .select("id, subject, category, priority, status, created_at, updated_at")
    .eq("requester_id", state.userId)
    .order("updated_at", { ascending: false })
    .limit(30);

  return (
    <SupportShell eyebrow={labels.eyebrow}>
      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <SupportTicketForm />
        <section className="grid content-start gap-4">
          <h2 className="text-xl font-black">Mes demandes</h2>
          {error ? (
            <EmptyState
              title="Demandes indisponibles"
              description="Votre historique d’assistance ne peut pas être affiché pour le moment."
            />
          ) : data?.length ? (
            <DataGrid>
              {data.map((ticket) => (
                <DataCard
                  key={ticket.id}
                  title={ticket.subject}
                  subtitle={toBusinessStatusLabel(ticket.status)}
                  rows={[
                    { label: "Sujet", value: toCategoryLabel(ticket.category) },
                    { label: "Priorité", value: toPriorityLabel(ticket.priority) },
                    {
                      label: "Dernière mise à jour",
                      value: new Date(ticket.updated_at).toLocaleString("fr-FR"),
                    },
                  ]}
                />
              ))}
            </DataGrid>
          ) : (
            <EmptyState
              title="Aucune demande en cours"
              description="Utilisez le formulaire pour contacter l’équipe Yobalelma."
            />
          )}
        </section>
      </div>
    </SupportShell>
  );
}

function SupportShell({
  children,
  eyebrow,
}: {
  children: ReactNode;
  eyebrow: string;
}) {
  return (
    <PageShell
      eyebrow={eyebrow}
      title="Assistance"
      description="Contactez l’équipe Yobalelma et suivez vos demandes."
      scene="support"
    >
      {children}
    </PageShell>
  );
}

function toCategoryLabel(category: string) {
  const labels: Record<string, string> = {
    damage: "Colis endommagé",
    delay: "Retard",
    kyc: "Vérification d’identité",
    other: "Autre demande",
    payment: "Paiement",
    shipment: "Expédition",
  };
  return labels[category] ?? "Demande d’assistance";
}

function toPriorityLabel(priority: string) {
  const labels: Record<string, string> = {
    high: "Haute",
    low: "Basse",
    normal: "Normale",
    urgent: "Urgente",
  };
  return labels[priority] ?? "Normale";
}
