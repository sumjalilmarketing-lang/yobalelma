import { PageShell } from "@/components/layout/page-shell";
import {
  ConfigurationNotice,
  DataCard,
  DataGrid,
  EmptyState,
} from "@/components/operations/status-panels";
import { requireRole } from "@/lib/auth/server";
import { selectFromLooseTable } from "@/lib/supabase/loose-query";
import { tryCreateSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type Receipt = {
  id: string;
  manifest_id: string | null;
  received_at: string | null;
  status: string;
  total_damaged: number;
  total_expected: number;
  total_extra: number;
  total_missing: number;
  total_received: number;
};

type ReceiptItem = {
  id: string;
  condition_note: string | null;
  status: string;
  tracking_code: string | null;
};

export default async function HubInboundDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const state = await requireRole(
    ["hub_agent", "hub_manager", "operations_manager", "admin", "super_admin"],
    `/dashboard/hub/inbound/${id}`,
  );

  return (
    <PageShell
      eyebrow="Hub"
      title="Detail reception hub"
      description="Controle le manifeste, les colis recus et les ecarts traites."
      scene="hub"
    >
      {state.status === "ready" ? <InboundDetail receiptId={id} /> : <ConfigurationNotice />}
    </PageShell>
  );
}

async function InboundDetail({ receiptId }: { receiptId: string }) {
  const supabase = await tryCreateSupabaseServerClient();

  if (!supabase) {
    return <ConfigurationNotice />;
  }

  const { data: receipt, error } = await selectFromLooseTable<Receipt>(
    supabase,
    "hub_inbound_receipts",
    "id, manifest_id, status, received_at, total_expected, total_received, total_missing, total_damaged, total_extra",
  )
    .eq("id", receiptId)
    .maybeSingle();

  if (error) {
    return <EmptyState title="Reception introuvable" description={error.message} />;
  }

  if (!receipt) {
    return <EmptyState title="Reception introuvable" description="Aucun manifeste hub ne correspond a cet identifiant." />;
  }

  const { data: items, error: itemsError } = await selectFromLooseTable<ReceiptItem>(
    supabase,
    "hub_inbound_receipt_items",
    "id, tracking_code, status, condition_note",
  )
    .eq("receipt_id", receiptId)
    .order("created_at", { ascending: false });

  if (itemsError) {
    return <EmptyState title="Colis non charges" description={itemsError.message} />;
  }

  return (
    <div className="grid gap-8">
      <DataGrid>
        <DataCard
          title={receipt.manifest_id ?? receipt.id}
          subtitle={receipt.status}
          rows={[
            { label: "Recus", value: `${receipt.total_received}/${receipt.total_expected}` },
            { label: "Manquants", value: receipt.total_missing },
            { label: "Endommages", value: receipt.total_damaged },
            { label: "Supplementaires", value: receipt.total_extra },
          ]}
        />
      </DataGrid>
      {items?.length ? (
        <DataGrid>
          {items.map((item) => (
            <DataCard
              key={item.id}
              title={item.tracking_code ?? item.id}
              subtitle={item.status}
              rows={[
                { label: "Note", value: item.condition_note ?? "Aucune note" },
              ]}
            />
          ))}
        </DataGrid>
      ) : (
        <EmptyState title="Aucun colis scanne" description="Les colis du manifeste apparaitront ici apres reception." />
      )}
    </div>
  );
}
