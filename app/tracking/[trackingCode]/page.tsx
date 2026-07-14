import { redirect } from "next/navigation";

export default async function TrackingAliasPage({
  params,
}: {
  params: Promise<{ trackingCode: string }>;
}) {
  const { trackingCode } = await params;

  redirect(`/suivi/${encodeURIComponent(trackingCode)}`);
}
