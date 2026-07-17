import { requireHubSession } from "@hub-app/src/lib/auth";
import { HubShell } from "@hub-app/src/components/hub-shell";

export default async function HubLayout({ children }: { children: React.ReactNode }) {
  const session = await requireHubSession("/hub");

  return <HubShell session={session}>{children}</HubShell>;
}
