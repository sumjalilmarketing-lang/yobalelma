import { notFound } from "next/navigation";
import { OperationalWorkspace } from "@/components/dashboard/operational-workspace";
import { getWorkspaceConfig } from "@/lib/dashboard/workspace-configs";

export const dynamic = "force-dynamic";

export default async function ClientSectionPage({
  params,
}: {
  params: Promise<{ section: string }>;
}) {
  const { section } = await params;
  const key = `client/${section}`;
  const config = getWorkspaceConfig(key);

  if (!config) {
    notFound();
  }

  return <OperationalWorkspace config={config} returnTo={`/dashboard/client/${section}`} />;
}

