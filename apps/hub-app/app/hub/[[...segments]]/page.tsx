import { requireHubSession } from "@hub-app/src/lib/auth";
import { HubRoutePage } from "@hub-app/src/components/hub-pages";
import { loadLiveHubState } from "@hub-app/src/lib/live-hub-data";
import { getHubState } from "@hub-app/src/lib/hub-store";
import { cookies } from "next/headers";
import { hubPickupQrCookie, verifyHubPickupQrToken } from "@hub-app/src/lib/session-token";
import { loadEnterpriseHubState } from "@hub-app/src/lib/enterprise-data";

export default async function HubCatchAllPage({
  params,
}: {
  params: Promise<{ segments?: string[] }>;
}) {
  const { segments } = await params;
  const pathname = `/hub${segments?.length ? `/${segments.join("/")}` : ""}`;
  const session = await requireHubSession(pathname);
  let hubState;
  try { hubState = await loadLiveHubState(session); } catch { hubState = null; }
  if (!hubState && session.source === "demo" && process.env.NODE_ENV !== "production") hubState = getHubState();
  if (!hubState) return <main className="mx-auto grid min-h-screen max-w-3xl place-items-center p-6"><section className="w-full rounded-2xl border bg-background p-8 text-center shadow-line"><h1 className="text-2xl font-black">Données Hub indisponibles</h1><p className="mt-3 text-muted-foreground">Les opérations n’ont pas pu être chargées. Aucune donnée de remplacement n’est affichée. Réessayez dans quelques instants.</p></section></main>;
  const enterpriseState = await loadEnterpriseHubState(session);
  const cookieStore = await cookies();
  const pickupQr = await verifyHubPickupQrToken(cookieStore.get(hubPickupQrCookie)?.value);

  if (pickupQr) {
    const batch = hubState.batches.find((candidate) => candidate.id === pickupQr.batchId);
    if (batch) batch.pickupQr = pickupQr;
  }

  return <HubRoutePage enterpriseState={enterpriseState} hubState={hubState} segments={segments} session={session} />;
}
