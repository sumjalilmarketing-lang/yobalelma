import { PageShell } from "@/components/layout/page-shell";
import { DataCard, DataGrid, EmptyState, ConfigurationNotice } from "@/components/operations/status-panels";
import { requireRole } from "@/lib/auth/server";
import { tryCreateSupabaseServerClient } from "@/lib/supabase/server";
import { toBusinessStatusLabel } from "@/lib/presentation/business-labels";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Notifications client | Yobalelma",
};

export default async function ClientNotificationsPage() {
  const state = await requireRole(["client"], "/dashboard/client/notifications");

  if (state.status !== "ready") {
    return (
      <PageShell eyebrow="Client" title="Notifications" description="Alertes in-app de suivi, remise et incidents." scene="client">
        <ConfigurationNotice />
      </PageShell>
    );
  }

  const supabase = await tryCreateSupabaseServerClient();

  if (!supabase) {
    return (
      <PageShell eyebrow="Client" title="Notifications" description="Alertes in-app de suivi, remise et incidents." scene="client">
        <ConfigurationNotice />
      </PageShell>
    );
  }

  const { data, error } = await supabase
    .from("notifications")
    .select("id, title, body, type, status, channel, action_url, created_at, read_at")
    .eq("recipient_id", state.userId)
    .order("created_at", { ascending: false })
    .limit(40);

  return (
    <PageShell eyebrow="Client" title="Notifications" description="Alertes in-app de suivi, remise et incidents." scene="client">
      {error ? <EmptyState title="Lecture impossible" description="Vos notifications ne sont pas disponibles pour le moment." /> : null}
      {data?.length ? (
        <DataGrid>
          {data.map((notification) => (
            <DataCard
              key={notification.id}
              href={notification.action_url ?? undefined}
              title={notification.title}
              subtitle={`${toNotificationChannelLabel(notification.channel)} · ${toBusinessStatusLabel(notification.status)}`}
              rows={[
                { label: "Message", value: notification.body },
                { label: "Date", value: new Date(notification.created_at).toLocaleString("fr-FR") },
                { label: "Lu", value: notification.read_at ? "oui" : "non" },
              ]}
            />
          ))}
        </DataGrid>
      ) : (
        <EmptyState title="Aucune notification" description="Les confirmations destination et livraison apparaitront ici." />
      )}
    </PageShell>
  );
}

function toNotificationChannelLabel(channel: string) {
  if (channel === "email") return "E-mail";
  if (channel === "sms") return "SMS";
  if (channel === "whatsapp") return "WhatsApp";
  if (channel === "push") return "Notification mobile";
  return "Notification Yobalelma";
}
