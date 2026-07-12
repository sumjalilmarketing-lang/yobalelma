import { UserSectionPage } from "@/apps/user-app/src/components/user-section-page";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Voyageur capacity | Yobalelma",
};

export default function Page() {
  return <UserSectionPage area="traveler" section="capacity" />;
}
