import { UserSectionPage } from "@/apps/user-app/src/components/user-section-page";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Client addresses | Yobalelma",
};

export default function Page() {
  return <UserSectionPage area="client" section="addresses" />;
}
