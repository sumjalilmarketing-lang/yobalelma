import { OperationalWorkspace } from "@/components/dashboard/operational-workspace";

export const dynamic = "force-dynamic";

export default function MissionHistoryPage() {
  return (
    <OperationalWorkspace
      returnTo="/dashboard/transporter/missions/history"
      config={{
        allowedRoles: ["local_transporter"],
        actions: [
          { href: "/dashboard/transporter/earnings", label: "Gains", permission: "payout:read" },
          { href: "/dashboard/transporter/ratings", label: "Evaluations", permission: "transporter:read" },
        ],
        checkpoints: [
          "Mission terminee.",
          "Preuve archivee.",
          "Payout eligible ou bloque.",
        ],
        description: "Historique des missions livreur et preuves associees.",
        eyebrow: "Livreur",
        metrics: [
          { label: "Livrees", table: "local_delivery_missions", userColumn: "transporter_id", filter: { column: "status", value: "delivered" } },
          { label: "Annulees", table: "local_delivery_missions", userColumn: "transporter_id", filter: { column: "status", value: "cancelled" } },
          { label: "Preuves", table: "delivery_proofs", userColumn: "uploaded_by" },
        ],
        permission: "mission:read",
        scene: "transporter",
        title: "Historique missions",
      }}
    />
  );
}

