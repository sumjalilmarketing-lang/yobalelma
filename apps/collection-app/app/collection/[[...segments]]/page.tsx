import { CollectionRoutePage } from "@collection-app/src/components/collection-pages";
import { requireCollectionSession } from "@collection-app/src/lib/auth";
import { getCollectionState } from "@collection-app/src/lib/collection-store";
export default async function CollectionPage({ params }: { params: Promise<{ segments?: string[] }> }) {
  const { segments } = await params; const pathname = `/collection${segments?.length ? `/${segments.join("/")}` : ""}`;
  const session = await requireCollectionSession(pathname); const state = getCollectionState();
  return <CollectionRoutePage segments={segments} session={session} state={state} />;
}
