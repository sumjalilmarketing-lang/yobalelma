import { UserSectionPage } from "@/apps/user-app/src/components/user-section-page";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Livreur profile | Yobalelma",
};

export default function Page() {
  return <UserSectionPage area="transporter" section="profile" />;
}
