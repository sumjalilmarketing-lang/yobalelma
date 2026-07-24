import { CollectionShell } from "@collection-app/src/components/collection-shell";
import { requireCollectionSession } from "@collection-app/src/lib/auth";
export default async function CollectionLayout({ children }: { children: React.ReactNode }) {
  const session = await requireCollectionSession("/collection");
  return <CollectionShell session={session}>{children}</CollectionShell>;
}
