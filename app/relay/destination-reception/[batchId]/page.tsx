import { redirect } from "next/navigation";

export default async function RelayDestinationBatchAliasPage({
  params,
}: {
  params: Promise<{ batchId: string }>;
}) {
  const { batchId } = await params;

  redirect(`/dashboard/relay/destination-reception/${batchId}`);
}
