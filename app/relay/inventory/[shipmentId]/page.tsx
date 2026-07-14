import { redirect } from "next/navigation";

export default async function RelayInventoryShipmentAliasPage({
  params,
}: {
  params: Promise<{ shipmentId: string }>;
}) {
  const { shipmentId } = await params;

  redirect(`/dashboard/relay/inventory/${shipmentId}`);
}
