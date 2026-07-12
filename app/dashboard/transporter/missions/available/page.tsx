import { OperationalWorkspace } from "@/components/dashboard/operational-workspace";

export const dynamic = "force-dynamic";

export default function AvailableMissionsPage() {
  return (
    <OperationalWorkspace
      returnTo="/dashboard/transporter/missions/available"
      config={{
        allowedRoles: ["local_transporter"],
        actions: [
          { href: "/dashboard/transporter/missions", label: "Toutes les missions", permission: "mission:read" },
          { href: "/dashboard/transporter/availability", label: "Disponibilite", permission: "transporter:write" },
        ],
        checkpoints: [
          "Missions offertes au livreur authentifie.",
          "KYC et disponibilite requis avant acceptation.",
          "Acceptation transactionnelle via RPC.",
        ],
        description: "Missions proposees par le dispatch automatique.",
        eyebrow: "Livreur",
        metrics: [
          { label: "Offertes", table: "local_delivery_missions", userColumn: "transporter_id", filter: { column: "status", value: "offered" } },
          { label: "Disponibilites", table: "transporter_availability", userColumn: "profile_id" },
        ],
        permission: "mission:read",
        scene: "transporter",
        title: "Missions disponibles",
      }}
    />
  );
}

