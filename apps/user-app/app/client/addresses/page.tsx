import { ClientAddressesPage } from "@/apps/user-app/src/components/client-addresses-page";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Client addresses | Yobalelma",
};

export default function Page() {
  return <ClientAddressesPage />;
}
