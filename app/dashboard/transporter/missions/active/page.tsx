import { OperationalWorkspace } from "@/components/dashboard/operational-workspace";

export const dynamic = "force-dynamic";

export default function ActiveMissionsPage() {
  return (
    <OperationalWorkspace
      returnTo="/dashboard/transporter/missions/active"
      config={{
        allowedRoles: ["local_transporter"],
        actions: [
          { href: "/dashboard/transporter/missions", label: "Toutes les missions", permission: "mission:read" },
          { href: "/dashboard/transporter/support", label: "Signaler un probleme", permission: "support:write" },
        ],
        checkpoints: [
          "Mission acceptee.",
          "Arrivee au point de retrait.",
          "Retrait confirme.",
          "Livraison ou depot relais.",
        ],
        description: "Missions acceptees et en cours d'execution.",
        eyebrow: "Livreur",
        metrics: [
          { label: "Acceptees", table: "local_delivery_missions", userColumn: "transporter_id", filter: { column: "status", value: "accepted" } },
          { label: "Retirees", table: "local_delivery_missions", userColumn: "transporter_id", filter: { column: "status", value: "picked_up" } },
        ],
        permission: "mission:read",
        scene: "transporter",
        title: "Missions actives",
      }}
    />
  );
}

