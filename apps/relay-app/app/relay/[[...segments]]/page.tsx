import { RelayRoutePage } from "@relay-app/src/components/relay-pages";
import { requireRelaySession } from "@relay-app/src/lib/auth";
import { loadRelayState } from "@relay-app/src/lib/relay-data";
export default async function RelayPage({ params }: { params: Promise<{ segments?: string[] }> }) {
  const { segments } = await params; const pathname = `/relay${segments?.length ? `/${segments.join("/")}` : ""}`;
  const session = await requireRelaySession(pathname); const state = await loadRelayState(session);
  return <RelayRoutePage segments={segments} session={session} state={state} />;
}
