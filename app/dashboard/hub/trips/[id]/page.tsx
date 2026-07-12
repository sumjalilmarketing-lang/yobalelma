import { OperationalWorkspace } from "@/components/dashboard/operational-workspace";

export const dynamic = "force-dynamic";

export default async function HubTripDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <OperationalWorkspace
      returnTo={`/dashboard/hub/trips/${id}`}
      config={{
        allowedRoles: ["hub_agent", "hub_manager", "operations_manager", "admin", "super_admin"],
        actions: [
          { href: "/dashboard/hub/batches/new", label: "Creer un lot", permission: "hub:write" },
          { href: "/dashboard/hub/trips", label: "Voyages hub", permission: "hub:read" },
        ],
        checkpoints: [
          "Voyage controle.",
          "Capacite disponible verifiee.",
          "Lot reserve transactionnellement.",
        ],
        description: "Vue hub d'un voyage et des lots associes.",
        eyebrow: "Hub",
        metrics: [
          { label: "Voyage cible", table: "trips", filter: { column: "id", value: id } },
          { label: "Lots du voyage", table: "hub_batches", filter: { column: "trip_id", value: id } },
          { label: "Reservations", table: "capacity_reservations" },
        ],
        permission: "hub:read",
        scene: "hub",
        title: "Voyage hub",
      }}
    />
  );
}
