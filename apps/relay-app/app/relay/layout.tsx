import { RelayShell } from "@relay-app/src/components/relay-shell";
import { requireRelaySession } from "@relay-app/src/lib/auth";
export default async function RelayLayout({ children }: { children: React.ReactNode }) {
  const session = await requireRelaySession("/relay");
  return <RelayShell session={session}>{children}</RelayShell>;
}
