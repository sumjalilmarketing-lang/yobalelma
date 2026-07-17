import { requireHubSession } from "@hub-app/src/lib/auth";
import { HubRoutePage } from "@hub-app/src/components/hub-pages";
import { loadLiveHubState } from "@hub-app/src/lib/live-hub-data";
import { getHubState } from "@hub-app/src/lib/hub-store";
import { cookies } from "next/headers";
import { hubPickupQrCookie, verifyHubPickupQrToken } from "@hub-app/src/lib/session-token";

export default async function HubCatchAllPage({
  params,
}: {
  params: Promise<{ segments?: string[] }>;
}) {
  const { segments } = await params;
  const pathname = `/hub${segments?.length ? `/${segments.join("/")}` : ""}`;
  const session = await requireHubSession(pathname);
  const hubState = (await loadLiveHubState(session)) ?? getHubState();
  const cookieStore = await cookies();
  const pickupQr = await verifyHubPickupQrToken(cookieStore.get(hubPickupQrCookie)?.value);

  if (pickupQr) {
    const batch = hubState.batches.find((candidate) => candidate.id === pickupQr.batchId);
    if (batch) batch.pickupQr = pickupQr;
  }

  return <HubRoutePage hubState={hubState} segments={segments} session={session} />;
}
