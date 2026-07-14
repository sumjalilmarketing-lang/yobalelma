import { redirect } from "next/navigation";

export default async function ClientShipmentAliasPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  redirect(`/dashboard/client/shipments/${id}`);
}
