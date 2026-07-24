import { UserSupportPage } from "@/apps/user-app/src/components/user-support-page";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Voyageur support | Yobalelma",
};

export default function Page() {
  return <UserSupportPage role="traveler" />;
}
