import { UserSectionPage } from "@/apps/user-app/src/components/user-section-page";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Voyageur notifications | Yobalelma",
};

export default function Page() {
  return <UserSectionPage area="traveler" section="notifications" />;
}
