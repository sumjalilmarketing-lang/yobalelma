import { OperationForm } from "@/components/operations/operation-form";
import { QrHandoverForm } from "@/components/operations/qr-handover-form";
import { PageShell } from "@/components/layout/page-shell";
import { ConfigurationNotice } from "@/components/operations/status-panels";
import { requireRole } from "@/lib/auth/server";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "QR handover | Yobalelma",
};

export default async function HubHandoverPage() {
  const state = await requireRole(
    ["hub_agent", "relay_agent", "operations_manager", "admin", "super_admin"],
    "/dashboard/hub/handover",
  );

  return (
    <PageShell
      eyebrow="Hub"
      title="QR de retrait et destination"
      description="Genere un QR opaque a usage unique, puis scanne le retrait ou le depot destination."
    >
      {state.status === "ready" ? (
        <div className="grid gap-8 lg:grid-cols-2">
          <QrHandoverForm />
          <OperationForm
            title="Scanner QR"
            endpoint="/api/qr/scan"
            submitLabel="Scanner"
            fields={[
              { name: "token", label: "Token QR", required: true },
              { name: "expectedTokenType", label: "Type attendu", type: "select", options: [
                { label: "Retrait origine", value: "origin_pickup" },
                { label: "Depot destination", value: "destination_dropoff" },
              ], required: true },
              { name: "incidentType", label: "Incident" },
              { name: "note", label: "Note", type: "textarea" },
            ]}
          />
        </div>
      ) : (
        <ConfigurationNotice />
      )}
    </PageShell>
  );
}
