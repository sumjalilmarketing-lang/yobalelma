import { redirect } from "next/navigation";

export default async function RelayFinalDeliveryDetailAliasPage({
  params,
}: {
  params: Promise<{ shipmentId: string }>;
}) {
  const { shipmentId } = await params;

  redirect(`/dashboard/relay/final-delivery/${shipmentId}`);
}
